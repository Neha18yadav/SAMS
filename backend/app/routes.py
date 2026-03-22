from flask import Blueprint, Response, jsonify, request, stream_with_context, current_app
from app.models import db, Student, Attendance, User
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
        'photo_path': s.photo_path
    } for s in students])

@main.route('/api/students', methods=['POST'])
def add_student():
    name = request.form.get('name')
    roll_no = request.form.get('roll_no')
    
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
                
                student = Student(name=name, roll_no=roll_no, face_encoding=encoding_bytes, photo_path=filepath)
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
            student = Student(name=name, roll_no=roll_no, face_encoding=None, photo_path=filepath)
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
    at_risk_count = 0
    all_students = Student.query.all()
    for s in all_students:
        total_records = Attendance.query.filter_by(student_id=s.id).count()
        present_records = Attendance.query.filter_by(student_id=s.id, status='Present').count()
        if total_records > 0:
            rate = (present_records / total_records) * 100
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
    students = Student.query.all()
    newly_absent = []
    for s in students:
        # Check if they were regular (>80%) in last 30 days
        thirty_ago = today - datetime.timedelta(days=30)
        records = Attendance.query.filter(
            Attendance.student_id == s.id,
            Attendance.date >= thirty_ago,
            Attendance.date < today - datetime.timedelta(days=2)
        ).all()
        
        if len(records) >= 5:
            recent_present = sum(1 for r in records if r.status == 'Present')
            historical_rate = recent_present / len(records)
            
            if historical_rate >= 0.80:
                # Check last 2 days
                absent_streak = 0
                for i in range(1, 4):
                    d = today - datetime.timedelta(days=i)
                    rec = Attendance.query.filter_by(student_id=s.id, date=d).first()
                    if not rec or rec.status != 'Present':
                        absent_streak += 1
                    else:
                        break
                
                if absent_streak >= 2:
                    newly_absent.append(s.name)

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

