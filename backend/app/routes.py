from flask import Blueprint, Response, jsonify, request, stream_with_context, current_app
from app.models import db, Student, Attendance, User, LeaveRequest
from werkzeug.security import generate_password_hash, check_password_hash
from app.jwt_utils import encode as jwt_encode, decode as jwt_decode
import time
from app.camera import VideoCamera, recognition_lock
import pickle
import os
import cv2
import numpy as np
import datetime
from sqlalchemy import func
import math

# ── SAMS AI client setup ─────────────────────────────────────────────────────
try:
    from groq import Groq as GroqClient
    _sams_client = GroqClient(api_key=os.environ.get('GROQ_API_KEY', ''))
    SAMS_MODEL = 'llama-3.3-70b-versatile'
    SAMS_AVAILABLE = bool(os.environ.get('GROQ_API_KEY', ''))
except Exception:
    _sams_client = None
    SAMS_AVAILABLE = False
    print('SAMS processing SDK not found. AI features will use fallback mode.')

# ── Teacher Timetable Data ───────────────────────────────────────────────────
TIMETABLE = {
    "0": [ # Monday
        {"start": "09:30", "end": "10:20", "code": "23CSH-387", "title": "Artificial Intelligence", "type": "Lecture"},
        {"start": "10:20", "end": "11:10", "code": "23CSH-385", "title": "Big Data Architecture", "type": "Lecture"},
        {"start": "11:20", "end": "12:10", "code": "23CSH-385", "title": "Big Data Architecture", "type": "Practical"},
        {"start": "12:10", "end": "13:00", "code": "23CSH-385", "title": "Big Data Architecture", "type": "Practical"},
        {"start": "13:55", "end": "14:45", "code": "23CSP-378", "title": "Competitive Coding-II", "type": "Practical"},
        {"start": "14:45", "end": "15:35", "code": "23CSP-378", "title": "Competitive Coding-II", "type": "Practical"},
        {"start": "15:35", "end": "16:25", "code": "23CSH-382", "title": "Full Stack-II", "type": "Tutorial"},
    ],
    "1": [ # Tuesday
        {"start": "09:30", "end": "10:20", "code": "23CST-390", "title": "System Design", "type": "Lecture"},
        {"start": "10:20", "end": "11:10", "code": "23CST-390", "title": "System Design", "type": "Lecture"},
        {"start": "11:20", "end": "12:10", "code": "23CSH-382", "title": "Full Stack-II", "type": "Practical"},
        {"start": "12:10", "end": "13:00", "code": "23CSH-382", "title": "Full Stack-II", "type": "Practical"},
        {"start": "13:05", "end": "13:55", "code": "23CSR-399", "title": "Major Project", "type": "Practical"},
        {"start": "13:55", "end": "14:45", "code": "23CSH-381", "title": "Big Data Technologies", "type": "Practical"},
        {"start": "14:45", "end": "15:35", "code": "23CSH-381", "title": "Big Data Technologies", "type": "Practical"},
    ],
    "2": [ # Wednesday
        {"start": "09:30", "end": "11:10", "code": "23CSH-382", "title": "Full Stack-II", "type": "Practical"},
        {"start": "11:20", "end": "13:00", "code": "23CSP-378", "title": "Competitive Coding-II", "type": "Practical"},
        {"start": "13:55", "end": "15:35", "code": "23CSH-381", "title": "Big Data Technologies", "type": "Lecture"},
        {"start": "15:35", "end": "17:15", "code": "23CSP-379", "title": "Software Engineering", "type": "Practical"},
    ],
    "3": [ # Thursday
        {"start": "09:30", "end": "11:10", "code": "23CSH-385", "title": "Big Data Architecture", "type": "Lecture"},
        {"start": "11:20", "end": "13:00", "code": "23TDT-362", "title": "Aptitude-IV", "type": "Lecture"},
        {"start": "13:55", "end": "14:45", "code": "23CST-390", "title": "System Design", "type": "Lecture"},
        {"start": "14:45", "end": "15:35", "code": "23CSH-387", "title": "Artificial Intelligence", "type": "Lecture"},
        {"start": "15:35", "end": "16:25", "code": "23CSH-381", "title": "Big Data Technologies", "type": "Lecture"},
    ],
    "4": [ # Friday
        {"start": "09:30", "end": "11:10", "code": "23CSH-387", "title": "Artificial Intelligence", "type": "Practical"},
        {"start": "11:20", "end": "13:00", "code": "23TDP-361", "title": "SOFT SKILLS IV", "type": "Practical"},
        {"start": "13:55", "end": "14:45", "code": "23CSH-381", "title": "Big Data Technologies", "type": "Lecture"},
        {"start": "14:45", "end": "15:35", "code": "23CSH-387", "title": "Artificial Intelligence", "type": "Lecture"},
        {"start": "15:35", "end": "16:25", "code": "23UCT-392", "title": "Leadership and Time Management", "type": "Lecture"},
    ]
}


def _sams_chat(system_prompt: str, user_message: str, max_tokens: int = 512) -> str:
    """Call SAMS core engine and return the intelligence response."""
    if not SAMS_AVAILABLE or not _sams_client:
        return 'SAMS Intelligence core is not configured. (Check API Link)'
    try:
        completion = _sams_client.chat.completions.create(
            model=SAMS_MODEL,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user',   'content': user_message},
            ],
            max_tokens=max_tokens,
            temperature=0.5,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f'SAMS API error: {e}')
        return f'⚠️ SAMS Intelligence is temporarily unavailable. Please try again shortly.'


def _build_attendance_context() -> str:
    """Build a rich text context block from live DB data to inject into AI prompts."""
    today = datetime.datetime.now().date()
    students = Student.query.all()
    total_students = len(students)
    present_today = Attendance.query.filter_by(date=today, status='Present').count()

    lines = [
        f'Today is {today.strftime("%Y-%m-%d")} ({today.strftime("%A")}).',
        f'Total registered students: {total_students}',
        f'Students present today: {present_today}',
        f'Students absent today: {total_students - present_today}',
        '',
        '=== Per-Student Data ===',
    ]

    for s in students:
        total = Attendance.query.filter_by(student_id=s.id).count()
        present = Attendance.query.filter_by(student_id=s.id, status='Present').count()
        rate = round((present / total) * 100, 1) if total > 0 else 0
        today_rec = Attendance.query.filter_by(student_id=s.id, date=today).first()
        today_status = today_rec.status if today_rec else 'Absent'
        lines.append(f'- {s.name} (Roll: {s.roll_no}): {present}/{total} days ({rate}%), status today: {today_status}')

    # Last 7 days trend
    lines.append('')
    lines.append('=== Last 7 Days Attendance Count ===')
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        count = Attendance.query.filter(Attendance.date == d, Attendance.status == 'Present').count()
        lines.append(f'  {d.strftime("%Y-%m-%d")}: {count} present')

    return '\n'.join(lines)

try:
    import face_recognition
except ImportError:
    face_recognition = None

main = Blueprint('main', __name__)

_ai_insight_cache = {}

# Global camera instance
# In production with multiple workers, this logic would need adjustment (e.g. separate streaming service)
camera = None

def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

@main.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')
    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    new_user = User(username=username, password_hash=generate_password_hash(password), role=role)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully', 'role': role}), 201

@main.route('/api/verify_token', methods=['GET'])
def verify_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'valid': False}), 401
    
    token = auth_header.split(' ')[1]
    try:
        data = jwt_decode(token, current_app.config.get('SECRET_KEY', 'default_dev_secret'))
        return jsonify({'valid': True, 'role': data.get('role'), 'user_id': data.get('user_id')}), 200
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 401

@main.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        # Fallback to hardcoded admin if database user not found
        if username == 'admin' and password == 'admin':
            token = jwt_encode({'user_id': 0, 'role': 'admin', 'exp': int(time.time()) + 86400}, current_app.config.get('SECRET_KEY', 'default_dev_secret'))
            return jsonify({'message': 'Login successful', 'role': 'admin', 'token': token}), 200
        return jsonify({'error': 'Invalid credentials'}), 401
        
    token = jwt_encode({'user_id': user.id, 'role': user.role, 'exp': int(time.time()) + 86400}, current_app.config.get('SECRET_KEY', 'default_dev_secret'))
    return jsonify({'message': 'Login successful', 'role': user.role, 'token': token}), 200

@main.route('/video_feed')
def video_feed():
    global camera
    if camera is None:
        camera = VideoCamera()
    return Response(stream_with_context(gen(camera)),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@main.route('/api/recognition/start', methods=['POST'])
def start_recognition():
    data = request.json or {}
    course_code = data.get('course_code')
    global camera
    if camera is None:
        camera = VideoCamera()
    success = camera.start_recognition(course_code=course_code)
    if not success:
        return jsonify({'error': 'Failed to initialize camera. Check hardware connection.'}), 500
    return jsonify({'message': f'Recognition started for {course_code or "General"}'})

@main.route('/api/timetable', methods=['GET'])
def get_timetable():
    return jsonify(TIMETABLE)

@main.route('/api/recognition/status', methods=['GET'])
def get_recognition_status():
    global camera
    if camera:
        return jsonify({
            'is_running': camera.is_running,
            'course_code': camera.current_course_code
        })
    return jsonify({'is_running': False, 'course_code': None})

@main.route('/api/recognition/stop', methods=['POST'])
def stop_recognition():
    global camera
    if camera and camera.is_running:
        camera.stop_recognition()
    return jsonify({'message': 'Recognition stopped'})

@main.route('/api/students', methods=['GET'])
def get_students():
    students = Student.query.all()
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'roll_no': s.roll_no,
        'section': s.section,
        'student_group': s.student_group,
        'photo_path': s.photo_path
    } for s in students])

@main.route('/api/students', methods=['POST'])
def add_student():
    name = request.form.get('name')
    roll_no = request.form.get('roll_no')
    section = request.form.get('section', '')
    student_group = request.form.get('student_group', '')
    
    if not name or not roll_no:
        print("Error: Missing name or roll_no")
        return jsonify({'error': 'Missing name or roll_no'}), 400
        
    if 'photo' not in request.files:
        print("Error: No photo provided in request.files")
        return jsonify({'error': 'No photo provided'}), 400
        
    photo = request.files['photo']
    if photo.filename == '':
        print("Error: No photo selected (empty filename)")
        return jsonify({'error': 'No photo selected'}), 400

    # Save photo
    filename = f"{roll_no}_{photo.filename}"
    filepath = os.path.join('app/static/faces', filename)
    # Ensure directory exists
    os.makedirs('app/static/faces', exist_ok=True)
    photo.save(filepath)
    
    # Process for encoding
    if face_recognition:
        try:
            image = face_recognition.load_image_file(filepath)
            with recognition_lock:
                encodings = face_recognition.face_encodings(image)
            
            if len(encodings) > 0:
                encoding = encodings[0]
                encoding_bytes = pickle.dumps(encoding)
                
                student = Student(name=name, roll_no=roll_no, section=section, student_group=student_group, face_encoding=encoding_bytes, photo_path=filepath)
                db.session.add(student)
                db.session.commit()
                
                # Reload camera encodings to include new student
                global camera
                if camera:
                    camera.load_encodings()
                    
                print(f"Successfully registered student {name}")
                return jsonify({'message': 'Student registered successfully'}), 201
            else:
                print("Error: No face detected in the photo.")
                return jsonify({'error': 'No face detected in photo'}), 400
        except Exception as e:
            db.session.rollback()
            if "UNIQUE constraint failed" in str(e):
                 return jsonify({'error': 'Student with this Roll No already exists'}), 400
            return jsonify({'error': str(e)}), 500
    else:
        # Fallback: Register without encoding
        try:
            student = Student(name=name, roll_no=roll_no, section=section, student_group=student_group, face_encoding=None, photo_path=filepath)
            db.session.add(student)
            db.session.commit()
            return jsonify({'message': 'Student registered (Face Reco Unavailable)'}), 201
        except Exception as e:
            db.session.rollback()
            if "UNIQUE constraint failed" in str(e):
                 return jsonify({'error': 'Student with this Roll No already exists'}), 400
            return jsonify({'error': str(e)}), 500

@main.route('/api/attendance', methods=['GET'])
def get_attendance():
    records = Attendance.query.order_by(Attendance.date.desc(), Attendance.time.desc()).all()
    return jsonify([{
        'id': r.id,
        'student_name': r.student.name,
        'student_roll': r.student.roll_no,
        'section': r.student.section,
        'student_group': r.student.student_group,
        'course_code': r.course_code,
        'date': str(r.date),
        'time': str(r.time),
        'status': r.status,
        'confidence': r.confidence
    } for r in records])

@main.route('/api/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    student = Student.query.get_or_404(id)
    try:
        # Delete photo from filesystem
        if student.photo_path and os.path.exists(student.photo_path):
            os.remove(student.photo_path)
            
        # Explicitly delete associated attendance records first (FKey constraint)
        Attendance.query.filter_by(student_id=id).delete()
            
        # Delete student from DB
        db.session.delete(student)
        db.session.commit()
        
        # Reload camera encodings to reflect deletion
        global camera
        if camera:
            camera.load_encodings()
            
        return jsonify({'message': f'Student {student.name} deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@main.route('/api/dashboard-stats', methods=['GET'])

def get_dashboard_stats():
    today = datetime.datetime.now().date()
    
    total_students = Student.query.count()
    present_today = Attendance.query.filter(Attendance.date == today, Attendance.status == 'Present').count()
    
    # Recent activity
    recent_records = Attendance.query.order_by(Attendance.date.desc(), Attendance.time.desc()).limit(5).all()
    recent_activity = [{
        'id': r.id,
        'student_name': r.student.name,
        'student_roll': r.student.roll_no,
        'section': r.student.section,
        'student_group': r.student.student_group,
        'course_code': r.course_code,
        'time': r.time.strftime("%I:%M %p"),
        'status': r.status
    } for r in recent_records]
    
    # 7-day trend
    trend = []
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        count = Attendance.query.filter(Attendance.date == d, Attendance.status == 'Present').count()
        trend.append({
            'date': d.strftime("%m/%d"),
            'count': count
        })
        
    # AI: count at-risk students (< 75% attendance)
    stats = db.session.query(
        Attendance.student_id, Attendance.status, func.count(Attendance.id)
    ).group_by(Attendance.student_id, Attendance.status).all()
    
    student_totals = {}
    student_presents = {}
    for student_id, status, count in stats:
        student_totals[student_id] = student_totals.get(student_id, 0) + count
        if status == 'Present':
            student_presents[student_id] = count

    at_risk_count = 0
    for student_id, total in student_totals.items():
        present = student_presents.get(student_id, 0)
        rate = (present / total) * 100
        if rate < 75:
            at_risk_count += 1

    return jsonify({
        'total_students': total_students,
        'present_today': present_today,
        'recent_activity': recent_activity,
        'attendance_trend': trend,
        'at_risk_students': at_risk_count
    })


# ─────────────────────────────────────────────────────────────────────────────
#  AI ENDPOINTS – SAMS (Smart Automated Management System)
# ─────────────────────────────────────────────────────────────────────────────

@main.route('/api/ai/insights', methods=['GET'])
def ai_insights():
    """AI Analytics: per-student rates, top/bottom performers, hourly distribution."""
    today = datetime.datetime.now().date()
    students = Student.query.all()
    student_stats = []

    for s in students:
        total = Attendance.query.filter_by(student_id=s.id).count()
        present = Attendance.query.filter_by(student_id=s.id, status='Present').count()
        rate = round((present / total) * 100, 1) if total > 0 else 0

        # Consecutive absences (look back up to 30 days)
        consecutive = 0
        for i in range(30):
            d = today - datetime.timedelta(days=i)
            rec = Attendance.query.filter_by(student_id=s.id, date=d).first()
            if rec and rec.status == 'Present':
                break
            consecutive += 1

        student_stats.append({
            'id': s.id,
            'name': s.name,
            'roll_no': s.roll_no,
            'total_classes': total,
            'present': present,
            'attendance_rate': rate,
            'consecutive_absences': consecutive,
        })

    # Sort for top/bottom
    sorted_stats = sorted(student_stats, key=lambda x: x['attendance_rate'], reverse=True)
    top_5 = sorted_stats[:5]
    bottom_5 = sorted_stats[-5:][::-1] if len(sorted_stats) >= 5 else sorted_stats[::-1]

    # 30-day trend
    trend_30 = []
    for i in range(29, -1, -1):
        d = today - datetime.timedelta(days=i)
        count = Attendance.query.filter(Attendance.date == d, Attendance.status == 'Present').count()
        trend_30.append({'date': d.strftime('%m/%d'), 'count': count})

    # Overall summary text
    total_s = len(students)
    if total_s == 0:
        summary = "No students registered yet."
    else:
        avg_rate = round(sum(s['attendance_rate'] for s in student_stats) / total_s, 1) if total_s else 0
        at_risk = sum(1 for s in student_stats if s['attendance_rate'] < 75)
        critical = sum(1 for s in student_stats if s['consecutive_absences'] >= 3)
        summary = (
            f"The system has {total_s} registered students with an average attendance rate of {avg_rate}%. "
            f"{at_risk} student(s) are at risk (attendance below 75%) and {critical} student(s) have been absent for 3 or more consecutive days."
        )

    return jsonify({
        'student_stats': student_stats,
        'top_performers': top_5,
        'low_performers': bottom_5,
        'trend_30_days': trend_30,
        'ai_summary': summary,
    })


@main.route('/api/ai/predict', methods=['GET'])
def ai_predict():
    """AI Predictions: risk score and category per student."""
    today = datetime.datetime.now().date()
    students = Student.query.all()
    predictions = []

    for s in students:
        total = Attendance.query.filter_by(student_id=s.id).count()
        present = Attendance.query.filter_by(student_id=s.id, status='Present').count()
        rate = (present / total) * 100 if total > 0 else 0

        # Consecutive absences
        consecutive = 0
        for i in range(30):
            d = today - datetime.timedelta(days=i)
            rec = Attendance.query.filter_by(student_id=s.id, date=d).first()
            if rec and rec.status == 'Present':
                break
            consecutive += 1

        # Risk score: weighted combo of rate and consecutive absences
        # 0 = totally fine, 100 = critical
        rate_risk = max(0, (75 - rate) / 75 * 60)            # up to 60 points from low rate
        consec_risk = min(40, consecutive * 10)               # up to 40 points from streaks
        risk_score = round(min(100, rate_risk + consec_risk), 1)

        if risk_score >= 70 or consecutive >= 3:
            category = 'Critical'
        elif risk_score >= 40 or rate < 75:
            category = 'At Risk'
        else:
            category = 'Healthy'

        predictions.append({
            'student_id': s.id,
            'name': s.name,
            'roll_no': s.roll_no,
            'attendance_rate': round(rate, 1),
            'consecutive_absences': consecutive,
            'risk_score': risk_score,
            'category': category,
        })

    # Sort by risk score descending
    predictions.sort(key=lambda x: x['risk_score'], reverse=True)
    return jsonify({'predictions': predictions})


@main.route('/api/ai/alerts', methods=['GET'])
def ai_alerts():
    """Smart Alerts: anomaly detection on attendance patterns."""
    today = datetime.datetime.now().date()
    alerts = []

    # 1. Today's attendance vs 7-day average
    today_count = Attendance.query.filter(Attendance.date == today, Attendance.status == 'Present').count()
    weekly_counts = []
    for i in range(1, 8):
        d = today - datetime.timedelta(days=i)
        c = Attendance.query.filter(Attendance.date == d, Attendance.status == 'Present').count()
        weekly_counts.append(c)
    
    avg_7 = sum(weekly_counts) / len(weekly_counts) if weekly_counts else 0
    
    if avg_7 > 0:
        drop_pct = ((avg_7 - today_count) / avg_7) * 100
        if drop_pct >= 50:
            alerts.append({
                'severity': 'critical',
                'title': 'Major Attendance Drop',
                'message': f"Today's attendance ({today_count}) is {round(drop_pct)}% below the 7-day average ({round(avg_7, 1)}). Immediate attention required.",
                'icon': 'alert-triangle'
            })
        elif drop_pct >= 30:
            alerts.append({
                'severity': 'warning',
                'title': 'Attendance Below Average',
                'message': f"Today's attendance ({today_count}) is {round(drop_pct)}% below the 7-day average ({round(avg_7, 1)}).",
                'icon': 'trending-down'
            })

    # 2. Previously regular students now absent 2+ days
    thirty_ago = today - datetime.timedelta(days=30)
    day_minus_2 = today - datetime.timedelta(days=2)
    
    # Query all attendance from last 30 days efficiency
    recent_records = Attendance.query.filter(Attendance.date >= thirty_ago).all()
    from collections import defaultdict
    student_records = defaultdict(list)
    for r in recent_records:
        student_records[r.student_id].append(r)
        
    students = Student.query.all()
    student_dict = {s.id: s.name for s in students}
    newly_absent = []
    
    for student_id, records in student_records.items():
        historical = [r for r in records if thirty_ago <= r.date < day_minus_2]
        if len(historical) >= 5:
            recent_present = sum(1 for r in historical if r.status == 'Present')
            historical_rate = recent_present / len(historical)
            
            if historical_rate >= 0.80:
                absent_streak = 0
                for i in range(1, 4):
                    d = today - datetime.timedelta(days=i)
                    rec = next((r for r in records if r.date == d), None)
                    if not rec or rec.status != 'Present':
                        absent_streak += 1
                    else:
                        break
                
                if absent_streak >= 2:
                    newly_absent.append(student_dict.get(student_id, "Unknown"))

    if newly_absent:
        names = ', '.join(newly_absent[:3]) + ('...' if len(newly_absent) > 3 else '')
        alerts.append({
            'severity': 'warning',
            'title': 'Regular Students Suddenly Absent',
            'message': f"{len(newly_absent)} previously regular student(s) absent 2+ days: {names}",
            'icon': 'user-x'
        })

    # 3. Positive alert if attendance is high
    total_students = Student.query.count()
    if total_students > 0 and avg_7 > 0:
        rate_today = (today_count / total_students) * 100
        if rate_today >= 90 and not any(a['severity'] == 'critical' for a in alerts):
            alerts.append({
                'severity': 'success',
                'title': 'Excellent Attendance Today',
                'message': f"{round(rate_today)}% of students are present today. Outstanding performance!",
                'icon': 'trending-up'
            })

    if not alerts:
        alerts.append({
            'severity': 'info',
            'title': 'All Systems Normal',
            'message': 'Attendance patterns look normal today. No anomalies detected.',
            'icon': 'check-circle'
        })

    return jsonify({'alerts': alerts, 'generated_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')})


@main.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    """SAMS-powered AI chat assistant with live attendance context."""
    data = request.json or {}
    raw_message = (data.get('message') or '').strip()
    conversation_history = data.get('history', [])

    if not raw_message:
        return jsonify({'reply': 'Please ask me something about attendance!'})

    context = _build_attendance_context()

    system_prompt = f"""You are SAMS — the intelligent assistant for the Smart Automated Management System (SAMS).
Your role:
- Answer questions about student attendance clearly and concisely
- Provide actionable insights, trends, and recommendations
- Be warm, professional, and use relevant emojis
- Keep responses focused and under 200 words
- When listing students, use bullet points
- Flag at-risk students (below 75% attendance) proactively
- Never make up data — only use the real-time context provided below

=== LIVE ATTENDANCE DATA ===
{context}
============================"""

    messages = [{'role': 'system', 'content': system_prompt}]
    for h in conversation_history[-8:]:
        if h.get('role') in ('user', 'assistant') and h.get('content'):
            messages.append({'role': h['role'], 'content': h['content']})
    messages.append({'role': 'user', 'content': raw_message})

    if not SAMS_AVAILABLE or not _sams_client:
        reply = '⚠️ SAMS Intelligence core is not configured.'
    else:
        try:
            completion = _sams_client.chat.completions.create(
                model=SAMS_MODEL,
                messages=messages,
                max_tokens=600,
                temperature=0.6,
            )
            reply = completion.choices[0].message.content.strip()
        except Exception as e:
            print(f'SAMS Intelligence error: {e}')
            reply = '⚠️ SAMS Intelligence is temporarily unavailable.'

    return jsonify({'reply': reply, 'timestamp': datetime.datetime.now().strftime('%H:%M')})

@main.route('/api/ai/analyze', methods=['POST'])
def ai_analyze():
    """Deep SAMS analysis: ask for strategic attendance recommendations and narrative insights."""
    data = request.json or {}
    focus = (data.get('focus') or 'overall').strip()
    context = _build_attendance_context()

    prompts = {
        'overall': 'Provide a comprehensive executive summary of the current attendance situation. Highlight key strengths, concerns, and 3 actionable recommendations.',
        'at-risk': 'Focus on identifying at-risk students. Explain severity, potential causes, and suggest specific intervention strategies.',
        'trends': 'Analyze the 7-day attendance trends. Identify patterns and predict future movements.',
        'report': 'Write a formal weekly attendance report suitable for school administration.',
    }
    user_prompt = prompts.get(focus, prompts['overall'])

    system_prompt = f"""You are SAMS — the expert educational data analyst for the Smart Automated Management System.
Analyze the provided attendance data and give detailed, professional insights in a minimalist, structured format.
Be specific with names and numbers.
Always be constructive and solutions-oriented.

=== LIVE ATTENDANCE DATA ===
{context}
============================"""

    reply = _sams_chat(system_prompt, user_prompt, max_tokens=1000)
    return jsonify({'analysis': reply, 'focus': focus, 'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M')})

@main.route('/api/student/dashboard', methods=['GET'])
def student_dashboard():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized access. Session terminated.'}), 401
    
    token = auth_header.split(' ')[1]
    try:
        data = jwt_decode(token, current_app.config.get('SECRET_KEY', 'default_dev_secret'))
    except Exception as e:
        return jsonify({'error': 'Invalid session token. Please re-authenticate.'}), 401
        
    user_id = data.get('user_id')
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User profile not found in deep storage.'}), 404
        
    student = Student.query.filter_by(roll_no=user.username).first()
    if not student:
        return jsonify({'error': 'Biometric profile not linked to this identity. Contact System Admin.'}), 404
        
    # Global Stats
    attendances = Attendance.query.filter_by(student_id=student.id).all()
    total_classes = len(attendances)
    present_classes = sum(1 for a in attendances if a.status == 'Present')
    overall_rate = round((present_classes / total_classes) * 100, 1) if total_classes > 0 else 0
    
    # Subject wise stats
    subject_stats = {}
    for a in attendances:
        cc = a.course_code or 'General'
        if cc not in subject_stats:
            subject_stats[cc] = {'total': 0, 'present': 0}
        subject_stats[cc]['total'] += 1
        if a.status == 'Present':
            subject_stats[cc]['present'] += 1
            
    subject_list = []
    for cc, stats in subject_stats.items():
        t = stats['total']
        p = stats['present']
        rate = round((p / t) * 100, 1)
        
        # Calculate Leaves allowed for 75%
        # Formula: P >= 0.75 * (T + X) => X <= (P/0.75) - T => X <= 4/3 * P - T
        leaves_allowed = math.floor((4/3) * p - t)
        
        if leaves_allowed < 0:
            leaves_allowed = 0
            # How many more consecutive presenting needed? Y >= 3*T - 4*P
            classes_needed = math.ceil(3*t - 4*p)
            status_text = f"Attention: Need {classes_needed} consecutive classes to recover to 75%"
            leaves_allowed = -classes_needed # use negative to easily identify in frontend
        else:
            status_text = f"Optimal: Can safely leave {leaves_allowed} classes and maintain 75%"
            
        subject_list.append({
            'course_code': cc,
            'total': t,
            'present': p,
            'rate': rate,
            'leaves_allowed': leaves_allowed,
            'status_text': status_text
        })
        
    # AI Prediction Engine
    if overall_rate == 0 and total_classes == 0:
        ai_insight = "System Awaiting Data: Begin your academic cycle to generate personalized AI insights."
    else:
        global _ai_insight_cache
        now_ts = time.time()
        cache_hit = _ai_insight_cache.get(student.id)
        if cache_hit and (now_ts - cache_hit['ts']) < 300: # 5 minutes TTL
            ai_insight = cache_hit['insight']
        else:
            system_prompt = "You are SAMS, an elite student guidance AI. Analyze the student's attendance parameters and provide concise, engaging foresight on how safely they can utilize leaves without dropping below 75%."
            user_prompt = f"Student {student.name} is tracking at {overall_rate}% global attendance. Granular metrics: {subject_list}. Synthesis instructions: Create a 3-sentence, high-impact overview advising the student precisely on their leave capabilities and future trajectory based on these numbers."
            ai_insight = _sams_chat(system_prompt, user_prompt, max_tokens=250)
            _ai_insight_cache[student.id] = {'ts': now_ts, 'insight': ai_insight}

    # Activity Stream
    recent_records = Attendance.query.filter_by(student_id=student.id).order_by(Attendance.date.desc(), Attendance.time.desc()).limit(7).all()
    recent_activity = [{
        'course_code': r.course_code or 'General Entry',
        'date': str(r.date),
        'time': r.time.strftime("%I:%M %p"),
        'status': r.status
    } for r in recent_records]

    # 7-day trend for this student
    today = datetime.datetime.now().date()
    trend = []
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        count = Attendance.query.filter(Attendance.student_id == student.id, Attendance.date == d, Attendance.status == 'Present').count()
        trend.append({
            'date': d.strftime("%a"),
            'count': count
        })
        
    # Current Schedule
    now = datetime.datetime.now()
    day_idx = now.weekday()
    day_str = str(day_idx)
    current_class = None
    next_class = None
    if day_str in TIMETABLE:
        time_str = now.strftime("%H:%M")
        schedule = TIMETABLE[day_str]
        for c in schedule:
            if c['start'] <= time_str <= c['end']:
                current_class = c
                break
            elif c['start'] > time_str and not next_class:
                next_class = c

    return jsonify({
        'student': {'name': student.name, 'roll_no': student.roll_no, 'photo_path': student.photo_path},
        'overall_rate': overall_rate,
        'total_classes': total_classes,
        'present_classes': present_classes,
        'subject_breakdown': subject_list,
        'recent_activity': recent_activity,
        'ai_insight': ai_insight,
        'attendance_trend': trend,
        'current_class': current_class,
        'next_class': next_class
    })


# --- LEAVE MANAGEMENT ---

@main.route('/api/leaves', methods=['GET'])
def get_leaves():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
    token = token.split('Bearer ')[-1]
    decoded = decode_jwt(token)
    if not decoded:
        return jsonify({'error': 'Invalid Token'}), 401

    if decoded['role'] == 'admin':
        leaves = LeaveRequest.query.order_by(LeaveRequest.created_at.desc()).all()
    else:
        student = Student.query.filter_by(roll_no=decoded['username']).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        leaves = LeaveRequest.query.filter_by(student_id=student.id).order_by(LeaveRequest.created_at.desc()).all()

    result = []
    for l in leaves:
        result.append({
            'id': l.id,
            'student_name': l.student.name,
            'roll_no': l.student.roll_no,
            'date_from': str(l.date_from),
            'date_to': str(l.date_to),
            'reason': l.reason,
            'status': l.status,
            'created_at': str(l.created_at.strftime("%b %d, %Y"))
        })
    return jsonify(result)

@main.route('/api/leaves', methods=['POST'])
def submit_leave():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
    token = token.split('Bearer ')[-1]
    decoded = decode_jwt(token)
    if not decoded:
        return jsonify({'error': 'Invalid Token'}), 401

    student = Student.query.filter_by(roll_no=decoded['username']).first()
    if not student:
        return jsonify({'error': 'Student configuration required'}), 404

    data = request.json
    try:
        from_date = datetime.datetime.strptime(data['date_from'], "%Y-%m-%d").date()
        to_date = datetime.datetime.strptime(data['date_to'], "%Y-%m-%d").date()
        new_leave = LeaveRequest(
            student_id=student.id,
            date_from=from_date,
            date_to=to_date,
            reason=data.get('reason', '')
        )
        db.session.add(new_leave)
        db.session.commit()
        return jsonify({'message': 'Leave application submitted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@main.route('/api/leaves/<int:leave_id>/status', methods=['PUT'])
def update_leave_status(leave_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
    token = token.split('Bearer ')[-1]
    decoded = decode_jwt(token)
    if not decoded or decoded['role'] != 'admin':
        return jsonify({'error': 'Unauthorized Admin Action'}), 401

    leave = LeaveRequest.query.get(leave_id)
    if not leave:
        return jsonify({'error': 'Leave request not found'}), 404

    data = request.json
    leave.status = data.get('status', leave.status)
    db.session.commit()
    return jsonify({'message': 'Status updated'})

# --- TIMETABLE AI AGENT ---

@main.route('/api/ai/timetable-agent', methods=['POST'])
def timetable_agent():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401
    token = token.split('Bearer ')[-1]
    decoded = decode_jwt(token)
    if not decoded:
        return jsonify({'error': 'Invalid Token'}), 401
        
    student = Student.query.filter_by(roll_no=decoded['username']).first()
    
    data = request.json
    schedule_context = data.get('schedule', [])
    day_name = data.get('day', 'Today')
    
    if not student:
        return jsonify({'response': 'You are viewing the master schedule. What an efficient system.'})

    prompt = f"""You are the SAMS AI Agent, an incredibly smart, highly perceptive assistant built directly into the student's timetable.
    
    Student Name: {student.name}
    Roll No: {student.roll_no}
    Viewing Schedule For: {day_name}
    Schedule Data: {schedule_context}
    
    The Schedule Data includes true/false values or percentages of their attendance mapped against the classes taking place on this day.
    
    Task: Write a concise (2-3 sentences max) insightful paragraph speaking directly to the student. 
    Act like a clever, hyper-aware AI agent. Review their day, point out any subject where their attendance is risky, 
    encourage them for good attendance, or give them a strategic recommendation for navigating this specific day. Keep it crisp, smart, and direct. Do not use asterisks or markdown.
    """
    
    client = GroqClient(api_key=os.environ.get("GROQ_API_KEY"))
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            temperature=0.7,
            max_tokens=150,
        )
        insight = response.choices[0].message.content.strip()
        return jsonify({'response': insight})
    except Exception as e:
        print(f"Groq API Error: {e}")
        return jsonify({'response': "SAMS AI Agent logic core is currently syncing. Focus on attending your scheduled modules."})

