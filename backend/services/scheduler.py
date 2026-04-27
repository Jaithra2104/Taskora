from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from models import get_db

scheduler = BackgroundScheduler()


def check_class_reminders():
    """Check for classes starting in the next hour and create reminders."""
    now = datetime.now()
    current_day = now.strftime('%A')
    one_hour_later = (now + timedelta(hours=1)).strftime('%H:%M')
    current_time = now.strftime('%H:%M')

    db = get_db()
    try:
        rows = db.execute(
            'SELECT t.*, u.name FROM timetable t JOIN users u ON t.user_id = u.id '
            'WHERE t.day = ? AND t.start_time > ? AND t.start_time <= ?',
            (current_day, current_time, one_hour_later)
        ).fetchall()

        for row in rows:
            existing = db.execute(
                "SELECT id FROM reminders WHERE user_id = ? AND type = 'class' "
                "AND message LIKE ? AND date(created_at) = date('now')",
                (row['user_id'], f"%{row['subject']}%")
            ).fetchone()

            if not existing:
                db.execute(
                    'INSERT INTO reminders (user_id, type, message, trigger_time) VALUES (?, ?, ?, ?)',
                    (row['user_id'], 'class',
                     f"📚 {row['subject']} starts at {row['start_time']} in {row['room'] or 'TBD'}",
                     row['start_time'])
                )
        db.commit()
    except Exception as e:
        print(f"Reminder error: {e}")
    finally:
        db.close()


def check_assignment_deadlines():
    """Check for assignments due soon."""
    db = get_db()
    try:
        # Due tomorrow
        rows = db.execute(
            "SELECT a.*, u.name FROM assignments a JOIN users u ON a.user_id = u.id "
            "WHERE a.status = 'pending' AND a.due_date = date('now', '+1 day')"
        ).fetchall()

        for row in rows:
            existing = db.execute(
                "SELECT id FROM reminders WHERE user_id = ? AND type = 'assignment' "
                "AND message LIKE ? AND date(created_at) = date('now')",
                (row['user_id'], f"%{row['title']}%")
            ).fetchone()

            if not existing:
                db.execute(
                    'INSERT INTO reminders (user_id, type, message, trigger_time) VALUES (?, ?, ?, ?)',
                    (row['user_id'], 'assignment',
                     f"⚠️ Assignment '{row['title']}' is due tomorrow!",
                     'deadline')
                )

        # Due today
        rows_today = db.execute(
            "SELECT a.*, u.name FROM assignments a JOIN users u ON a.user_id = u.id "
            "WHERE a.status = 'pending' AND a.due_date = date('now')"
        ).fetchall()

        for row in rows_today:
            existing = db.execute(
                "SELECT id FROM reminders WHERE user_id = ? AND type = 'assignment_urgent' "
                "AND message LIKE ? AND date(created_at) = date('now')",
                (row['user_id'], f"%{row['title']}%")
            ).fetchone()

            if not existing:
                db.execute(
                    'INSERT INTO reminders (user_id, type, message, trigger_time) VALUES (?, ?, ?, ?)',
                    (row['user_id'], 'assignment_urgent',
                     f"🚨 Assignment '{row['title']}' is due TODAY!",
                     'deadline')
                )

        db.commit()
    except Exception as e:
        print(f"Assignment reminder error: {e}")
    finally:
        db.close()


def check_homework_reminders():
    """Remind about pending homework after college hours."""
    db = get_db()
    try:
        rows = db.execute(
            "SELECT h.*, u.name FROM homework h JOIN users u ON h.user_id = u.id "
            "WHERE h.status = 'pending' AND date(h.created_at) >= date('now', '-2 days')"
        ).fetchall()

        for row in rows:
            existing = db.execute(
                "SELECT id FROM reminders WHERE user_id = ? AND type = 'homework' "
                "AND message LIKE ? AND date(created_at) = date('now')",
                (row['user_id'], f"%{row['subject']}%")
            ).fetchone()

            if not existing:
                db.execute(
                    'INSERT INTO reminders (user_id, type, message, trigger_time) VALUES (?, ?, ?, ?)',
                    (row['user_id'], 'homework',
                     f"📝 Pending homework: {row['subject']} - {row['description'][:50]}",
                     'evening')
                )
        db.commit()
    except Exception as e:
        print(f"Homework reminder error: {e}")
    finally:
        db.close()


def init_scheduler():
    """Initialize the background scheduler with all jobs."""
    scheduler.add_job(check_class_reminders, 'interval', minutes=15, id='class_reminders', replace_existing=True)
    scheduler.add_job(check_assignment_deadlines, 'interval', hours=6, id='assignment_deadlines', replace_existing=True)
    scheduler.add_job(check_homework_reminders, 'cron', hour=17, minute=0, id='homework_evening', replace_existing=True)

    if not scheduler.running:
        scheduler.start()
        print("[OK] Scheduler started")
