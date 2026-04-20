import cv2
try:
    import face_recognition
except ImportError:
    face_recognition = None
    print("face_recognition library not found. Running in fallback mode.")

import pickle
import os
import numpy as np
from datetime import datetime
from app.models import Student, Attendance
from app import db
from flask import current_app
import threading

recognition_lock = threading.Lock()

class VideoCamera(object):
    def __init__(self):
        self.video = None
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_face_ids = []
        self.is_running = False
        self.current_course_code = None # Track active subject
        self.last_marked = {} # {student_id: datetime}
        self.load_encodings()

    def __del__(self):
        if self.video and self.video.isOpened():
            self.video.release()

    def start_recognition(self, course_code=None):
        if not self.is_running:
            # Try camera indices 0, 1, 2 to find a working one
            found_camera = False
            for index in [0, 1, 2]:
                print(f"Attempting to open camera at index {index}...")
                cap = cv2.VideoCapture(index)
                if cap.isOpened():
                    # Test if we can actually read a frame
                    success, _ = cap.read()
                    if success:
                        self.video = cap
                        print(f"Successfully opened camera at index {index}")
                        found_camera = True
                        break
                    else:
                        print(f"Camera at index {index} opened but failed to capture frame.")
                        cap.release()
                else:
                    print(f"Could not open camera at index {index}.")

            if not found_camera:
                print("Error: No functional camera found.")
                return False

            self.is_running = True
            self.current_course_code = course_code
            self.last_marked = {} # Clear throttle for fresh session
            print(f"Recognition started for {course_code or 'General'} - Camera Active")
            return True
        return True

    def stop_recognition(self):
        self.is_running = False
        if self.video and self.video.isOpened():
            self.video.release()
        print("Recognition stopped - Camera Closed")

    def load_encodings(self):
        # Load all students from DB
        print("Starting to load face encodings from database...")
        try:
            with current_app.app_context():
                students = Student.query.all()
                self.known_face_encodings = []
                self.known_face_names = []
                self.known_face_ids = []
                for student in students:
                    if student.face_encoding:
                        try:
                            self.known_face_encodings.append(pickle.loads(student.face_encoding))
                            self.known_face_names.append(student.name)
                            self.known_face_ids.append(student.id)
                        except Exception as e:
                            print(f"Error loading encoding for student {student.id}: {e}")
            print(f"Successfully loaded {len(self.known_face_encodings)} face encodings.")
        except Exception as e:
            print(f"Error accessing DB for encodings (Database might not be initialized yet): {e}")

    def get_frame(self):
        if not self.is_running or self.video is None or not self.video.isOpened():
             # Return a black frame or placeholder if camera is off
            blank_image = np.zeros((480, 640, 3), np.uint8)
            font = cv2.FONT_HERSHEY_DUPLEX
            cv2.putText(blank_image, "Camera Off", (200, 240), font, 1.0, (255, 255, 255), 2)
            ret, jpeg = cv2.imencode('.jpg', blank_image)
            return jpeg.tobytes()

        success, image = self.video.read()
        if not success:
            # If capture fails mid-stream, return error frame
            error_image = np.zeros((480, 640, 3), np.uint8)
            font = cv2.FONT_HERSHEY_DUPLEX
            cv2.putText(error_image, "Capture Error", (200, 240), font, 1.0, (0, 0, 255), 2)
            ret, jpeg = cv2.imencode('.jpg', error_image)
            return jpeg.tobytes()

        # Resize for faster processing
        small_frame = cv2.resize(image, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

        if face_recognition and self.is_running:
            with recognition_lock:
                face_locations = face_recognition.face_locations(rgb_small_frame)
                face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

            face_names = []
            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
                name = "Unknown"
                student_id = None
                confidence = 0.0

                face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
                if len(face_distances) > 0:
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        name = self.known_face_names[best_match_index]
                        student_id = self.known_face_ids[best_match_index]
                        
                        # Calculate confidence: 0.0 is perfect match, 0.6 is threshold
                        # Typical range for match is 0.3 - 0.6. Map to 0-100% logic
                        distance = face_distances[best_match_index]
                        if distance > 0.6:
                            distance = 0.6 # Cap at threshold
                        
                        # Inverse mapping: 0.0 -> 100%, 0.6 -> 0% (relative to threshold)
                        # Actually better to just show raw match percentage: (1 - distance) * 100
                        confidence = round((1 - distance) * 100, 2)
                        
                        self.mark_attendance(student_id, confidence)

                face_names.append(f"{name} ({confidence}%)" if name != "Unknown" else name)

            # Draw results
            for (top, right, bottom, left), name in zip(face_locations, face_names):
                top *= 4
                right *= 4
                bottom *= 4
                left *= 4

                cv2.rectangle(image, (left, top), (right, bottom), (0, 0, 255), 2)
                cv2.rectangle(image, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
                font = cv2.FONT_HERSHEY_DUPLEX
                cv2.putText(image, name, (left + 6, bottom - 6), font, 0.6, (255, 255, 255), 1)
        
        elif not self.is_running:
             # Indicate halted state
            font = cv2.FONT_HERSHEY_DUPLEX
            cv2.putText(image, "Recognition Paused", (10, 30), font, 1.0, (0, 255, 255), 2)

        elif not face_recognition:
             # Fallback
            font = cv2.FONT_HERSHEY_DUPLEX
            cv2.putText(image, "Face Reco Unavailable", (10, 30), font, 1.0, (0, 0, 255), 1)

        ret, jpeg = cv2.imencode('.jpg', image)
        return jpeg.tobytes()

    def mark_attendance(self, student_id, confidence):
        if student_id is None:
            return
            
        try:
            # Throttle: Don't record same student within 10 seconds in the same session
            now = datetime.now()
            if student_id in self.last_marked:
                if (now - self.last_marked[student_id]).total_seconds() < 10:
                    return
            
            today = now.date()
            # In "rerecord" mode, we allow multiple entries today as long as it's a new session or throttle passed
            attendance = Attendance(
                student_id=student_id, 
                course_code=self.current_course_code,
                date=today, 
                time=now.time(), 
                status='Present', 
                confidence=confidence
            )
            db.session.add(attendance)
            db.session.commit()
            self.last_marked[student_id] = now
            print(f"Recorded attendance for {student_id} in {self.current_course_code or 'General'} ({confidence}%)")
        except Exception as e:
            print(f"Error marking attendance: {e}")
