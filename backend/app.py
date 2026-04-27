import os
from flask import Flask, jsonify, send_from_directory, abort
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from config import Config
from models import init_db, get_db
from routes.auth import auth_bp
from routes.timetable import timetable_bp
from routes.homework import homework_bp
from routes.assignments import assignments_bp
from routes.certificates import certificates_bp
from routes.syllabus import syllabus_bp
from routes.study import study_bp
from services.scheduler import init_scheduler

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
CORS(app, origins=["https://taskora-khaki.vercel.app", "http://localhost:5173"])
jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(timetable_bp, url_prefix='/api/timetable')
app.register_blueprint(homework_bp, url_prefix='/api/homework')
app.register_blueprint(assignments_bp, url_prefix='/api/assignments')
app.register_blueprint(certificates_bp, url_prefix='/api/certificates')
app.register_blueprint(syllabus_bp, url_prefix='/api/syllabus')
app.register_blueprint(study_bp, url_prefix='/api/study')


# Serve uploaded files — handles Windows path separators
@app.route('/uploads/<int:user_id>/certificates/<filename>')
def serve_certificate(user_id, filename):
    directory = os.path.join(Config.UPLOAD_FOLDER, str(user_id), 'certificates')
    if not os.path.isfile(os.path.join(directory, filename)):
        abort(404)
    return send_from_directory(directory, filename)


# Dashboard endpoint
@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    from datetime import datetime
    today = datetime.now().strftime('%A')

    db = get_db()
    try:
        schedule = db.execute(
            'SELECT * FROM timetable WHERE user_id = ? AND day = ? ORDER BY start_time',
            (user_id, today)
        ).fetchall()

        homework = db.execute(
            "SELECT * FROM homework WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 5",
            (user_id,)
        ).fetchall()

        assignments = db.execute(
            "SELECT * FROM assignments WHERE user_id = ? AND status = 'pending' "
            "AND due_date >= date('now') ORDER BY due_date ASC LIMIT 5",
            (user_id,)
        ).fetchall()

        syllabus_raw = db.execute(
            'SELECT subject, COUNT(*) as total, SUM(status) as completed '
            'FROM syllabus WHERE user_id = ? GROUP BY subject',
            (user_id,)
        ).fetchall()

        syllabus_progress = []
        for s in syllabus_raw:
            syllabus_progress.append({
                'subject': s['subject'],
                'total': s['total'],
                'completed': s['completed'] or 0,
                'progress': round(((s['completed'] or 0) / s['total']) * 100, 1) if s['total'] > 0 else 0
            })

        reminders = db.execute(
            "SELECT * FROM reminders WHERE user_id = ? AND date(created_at) = date('now') "
            "ORDER BY created_at DESC LIMIT 10",
            (user_id,)
        ).fetchall()

        total_hw   = db.execute('SELECT COUNT(*) as c FROM homework WHERE user_id = ?', (user_id,)).fetchone()['c']
        done_hw    = db.execute("SELECT COUNT(*) as c FROM homework WHERE user_id = ? AND status='completed'", (user_id,)).fetchone()['c']
        total_asg  = db.execute('SELECT COUNT(*) as c FROM assignments WHERE user_id = ?', (user_id,)).fetchone()['c']
        done_asg   = db.execute("SELECT COUNT(*) as c FROM assignments WHERE user_id = ? AND status='completed'", (user_id,)).fetchone()['c']
        total_certs = db.execute('SELECT COUNT(*) as c FROM certificates WHERE user_id = ?', (user_id,)).fetchone()['c']

        return jsonify({
            'day': today,
            'schedule': [dict(r) for r in schedule],
            'pending_homework': [dict(r) for r in homework],
            'upcoming_assignments': [dict(r) for r in assignments],
            'syllabus_progress': syllabus_progress,
            'reminders': [dict(r) for r in reminders],
            'stats': {
                'homework': {'total': total_hw, 'completed': done_hw},
                'assignments': {'total': total_asg, 'completed': done_asg},
                'certificates': total_certs
            }
        }), 200
    finally:
        db.close()


@app.route('/api/reminders', methods=['GET'])
@jwt_required()
def get_reminders():
    user_id = get_jwt_identity()
    db = get_db()
    try:
        rows = db.execute(
            "SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
            (user_id,)
        ).fetchall()
        return jsonify({'reminders': [dict(r) for r in rows]}), 200
    finally:
        db.close()


@app.route('/api/reminders/clear', methods=['DELETE'])
@jwt_required()
def clear_reminders():
    user_id = get_jwt_identity()
    db = get_db()
    try:
        db.execute('DELETE FROM reminders WHERE user_id = ?', (user_id,))
        db.commit()
        return jsonify({'message': 'Reminders cleared'}), 200
    finally:
        db.close()


import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Smart Student Companion API is running'}), 200


@app.route('/')
def home():
    return "🚀 Taskora Backend is Live!"


@app.route('/test')
def test():
    return "TEST WORKING"


# Initialize DB and Scheduler on startup
try:
    with app.app_context():
        logger.info("Initializing application components...")
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        init_db()
        init_scheduler()
        logger.info("[OK] Application initialized successfully")
except Exception as e:
    logger.error(f"CRITICAL STARTUP ERROR: {str(e)}")
    import traceback
    logger.error(traceback.format_exc())
    # Don't exit here, let the app try to start so we can see logs
    pass


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
