import sys
import os
import smtplib
import traceback
from email.mime.text import MIMEText

# Add the current directory to the path so we can import models and config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from models import get_db
    from config import Config
except ImportError:
    print("[Error] Could not import models or config. Make sure you are running this from the backend directory.")
    sys.exit(1)

def send_greetings():
    print(f"\n{'='*50}")
    print("🚀 TASKORA BULK EMAIL SERVICE")
    print(f"{'='*50}\n")

    email_user = os.environ.get('EMAIL_USER')
    email_pass = os.environ.get('EMAIL_PASS')

    if not email_user:
        email_user = input("📧 Enter your Taskora Gmail address: ").strip()
    if not email_pass:
        email_pass = input("🔑 Enter your Gmail App Password: ").strip()

    if not email_user or not email_pass:
        print("\n❌ [Error] Gmail address and App Password are required.")
        print("💡 Tip: Use a Google App Password, not your regular password.")
        return

    db = None
    try:
        print("[DB] Connecting to database...")
        db = get_db()
        
        # Query users
        cursor = db.execute('SELECT name, email FROM users')
        rows = cursor.fetchall()
        
        users = []
        for row in rows:
            # Handle both sqlite3.Row and dict (for Postgres)
            name = row['name'] if isinstance(row, dict) or hasattr(row, 'keys') else row[0]
            email = row['email'] if isinstance(row, dict) or hasattr(row, 'keys') else row[1]
            users.append({'name': name, 'email': email})
                
        print(f"✅ Found {len(users)} registered users.")

        if not users:
            print("[Info] No users found in the database.")
            return

        print(f"[SMTP] Connecting to Gmail SMTP server (smtp.gmail.com:587)...")
        server = None
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
            server.set_debuglevel(0) # Set to 1 for detailed SMTP logs
            server.starttls()
            
            print("[SMTP] Attempting login...")
            server.login(email_user, email_pass)
            print("🔓 [SMTP] Login successful!")
            
        except smtplib.SMTPAuthenticationError:
            print("\n❌ [SMTP Error] Authentication failed.")
            print("   Possible reasons:")
            print("   1. Incorrect email or App Password.")
            print("   2. 'Less secure apps' is blocked (Use App Password instead).")
            print("   3. 2FA is enabled but App Password was not used.")
            return
        except Exception as e:
            print(f"\n❌ [SMTP Error] Connection failed: {str(e)}")
            return

        print(f"\n[Status] Sending emails to {len(users)} users...")
        success_count = 0
        fail_count = 0

        for user in users:
            name = user['name']
            email = user['email']
            
            if not email or "@" not in email:
                print(f"⚠️ [Skip] Invalid email for {name}: {email}")
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
                print(f"   ✅ Sent to {name} ({email})")
                success_count += 1
            except Exception as e:
                print(f"   ❌ Failed to send to {email}: {str(e)}")
                fail_count += 1

        print("\n[SMTP] Closing connection...")
        server.quit()
        
        # Log results
        try:
            db.execute(
                'INSERT INTO email_logs (subject, recipients_count) VALUES (?, ?)',
                ("Welcome to Taskora! 📘✨", success_count)
            )
            db.commit()
            print("[DB] Metrics logged successfully.")
        except Exception as e:
            # Silently handle missing table if init_db wasn't run
            print(f"[DB Warning] Could not log metrics (Table might be missing): {str(e)}")
            
        print(f"\n{'='*50}")
        print(f"🏁 Bulk emailing completed!")
        print(f"   - Success: {success_count}")
        print(f"   - Failed:  {fail_count}")
        print(f"{'='*50}\n")

    except Exception as e:
        print(f"\n❌ [Critical Error] {str(e)}")
        traceback.print_exc()
    finally:
        if db:
            db.close()

if __name__ == "__main__":
    send_greetings()
