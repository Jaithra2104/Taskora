import sys
import os
import smtplib
from email.mime.text import MIMEText

# Add the current directory to the path so we can import models and config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import get_db
from config import Config

def send_greetings():
    email_user = os.environ.get('EMAIL_USER')
    email_pass = os.environ.get('EMAIL_PASS')

    if not email_user:
        email_user = input("Enter your Taskora Gmail address: ").strip()
    if not email_pass:
        email_pass = input("Enter your Gmail App Password: ").strip()

    if not email_user or not email_pass:
        print("[Error] Gmail address and App Password are required.")
        return

    print("[DB] Connecting to database...")
    db = get_db()
    try:
        # Query users
        cursor = db.execute('SELECT name, email FROM users')
        
        users = []
        for row in cursor.fetchall():
            users.append({'name': row['name'], 'email': row['email']})
                
        print(f"Found {len(users)} registered users.")

        if not users:
            print("[Info] No users found in the database.")
            return

        print("[SMTP] Connecting to Gmail SMTP server...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(email_user, email_pass)
        
        print("[Status] Sending emails...")
        success_count = 0
        fail_count = 0

        for user in users:
            name = user['name']
            email = user['email']
            
            if not email:
                continue

            subject = "Welcome to Taskora! 📘✨"
            body = f"""Hi {name},

Thank you for using Taskora! We are thrilled to have you onboard as your smart student companion. 

Taskora is designed to help you track your classes, manage assignments, master your syllabus, and streamline your study routines effortlessly.

If you have any feedback or suggestions to make Taskora better, please let us know.

Keep shining,
The Taskora Team
"""
            msg = MIMEText(body)
            msg['Subject'] = subject
            msg['From'] = email_user
            msg['To'] = email

            try:
                server.send_message(msg)
                print(f"[Success] Sent to {name} ({email})")
                success_count += 1
            except Exception as e:
                print(f"[Failed] Failed to send to {email}: {str(e)}")
                fail_count += 1

        server.quit()
        
        try:
            db.execute(
                'INSERT INTO email_logs (subject, recipients_count) VALUES (?, ?)',
                ("Welcome to Taskora! 📘✨", success_count)
            )
            db.commit()
        except Exception as e:
            print(f"[DB Error] Failed to log email metrics: {str(e)}")
            
        print(f"\nBulk emailing completed! Total Success: {success_count}, Failed: {fail_count}")

    except Exception as e:
        print(f"[Error] An error occurred: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    send_greetings()
