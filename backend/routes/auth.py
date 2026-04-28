from flask import Blueprint, request, jsonify, redirect
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import get_db
import random
import smtplib
from email.mime.text import MIMEText
import os
import requests

auth_bp = Blueprint('auth', __name__)

otp_store = {}

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    """Send an OTP for email verification."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    db = get_db()
    try:
        existing = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        if existing:
            return jsonify({'error': 'Email already registered'}), 409
    finally:
        db.close()

    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp

    import os
    email_user = os.environ.get('EMAIL_USER')
    email_pass = os.environ.get('EMAIL_PASS')

    if email_user and email_pass:
        try:
            msg = MIMEText(f"Welcome to Taskora!\n\nYour verification code is: {otp}\n\nPlease enter this code on the signup page to complete your account creation.")
            msg['Subject'] = 'Taskora - Email Verification'
            msg['From'] = email_user
            msg['To'] = email

            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(email_user, email_pass)
            server.send_message(msg)
            server.quit()
            
            return jsonify({'message': 'OTP sent successfully to your email!'}), 200
        except Exception as e:
            print(f"SMTP Error: {str(e)}")
            return jsonify({'error': f'Failed to send email: {str(e)}'}), 500
    else:
        # Fallback for demo purposes
        print(f"\n{'='*40}")
        print(f"🔐 MOCK EMAIL SENT (No SMTP Configured)")
        print(f"To: {email}")
        print(f"OTP CODE: {otp}")
        print(f"{'='*40}\n")

        return jsonify({
            'message': 'Demo mode active (No SMTP credentials set in backend environment).',
            'otp_for_demo': otp
        }), 200

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    otp = data.get('otp', '').strip()

    if not name or not email or not password or not otp:
        return jsonify({'error': 'Name, email, password, and OTP are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    # Verify OTP
    stored_otp = otp_store.get(email)
    if not stored_otp or stored_otp != otp:
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    db = get_db()
    try:
        existing = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
        if existing:
            return jsonify({'error': 'Email already registered'}), 409

        hashed_password = generate_password_hash(password)
        cursor = db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            (name, email, hashed_password)
        )
        user_id = cursor.lastrowid
        db.commit()

        access_token = create_access_token(identity=str(user_id))

        # Clear OTP after successful registration
        if email in otp_store:
            del otp_store[email]

        return jsonify({
            'message': 'Account created successfully',
            'token': access_token,
            'user': {'id': user_id, 'name': name, 'email': email}
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    db = get_db()
    try:
        user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

        if not user or not check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid email or password'}), 401

        access_token = create_access_token(identity=str(user['id']))

        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        user = db.execute('SELECT id, name, email, created_at FROM users WHERE id = ?', (user_id,)).fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        try:
            db.execute('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?', (user_id,))
            db.commit()
        except Exception:
            pass

        return jsonify({
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'created_at': user['created_at']
            }
        }), 200
    finally:
        db.close()




@auth_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def admin_get_users():
    user_id = get_jwt_identity()
    db = get_db()
    try:
        user = db.execute('SELECT email FROM users WHERE id = ?', (user_id,)).fetchone()
        email = user.get('email') if isinstance(user, dict) else user['email'] if user else None
        if email != 'officialtaskora@gmail.com':
            return jsonify({'error': 'Unauthorized access.'}), 403
            
        cursor = db.execute('SELECT * FROM users ORDER BY created_at DESC')
        users = []
        for row in cursor.fetchall():
            is_dict = isinstance(row, dict)
            keys = row.keys() if is_dict else [k for k in row.keys()]
            
            users.append({
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'created_at': row['created_at'],
                'last_active': row['last_active'] if 'last_active' in keys else None
            })
            
        return jsonify({'users': users}), 200
        
    except Exception as e:
        return jsonify({'error': f'Admin Error: {str(e)}'}), 500
    finally:
        db.close()


@auth_bp.route('/admin/stats', methods=['GET'])
@jwt_required()
def admin_get_stats():
    user_id = get_jwt_identity()
    db = get_db()
    try:
        user = db.execute('SELECT email FROM users WHERE id = ?', (user_id,)).fetchone()
        email = user.get('email') if isinstance(user, dict) else user['email'] if user else None
        if email != 'officialtaskora@gmail.com':
            return jsonify({'error': 'Unauthorized access.'}), 403
        def get_count(table):
            try:
                row = db.execute(f'SELECT COUNT(*) as count FROM {table}').fetchone()
                if isinstance(row, dict):
                    return row.get('count', 0)
                return row[0] if row else 0
            except Exception:
                return 0

        total_users = get_count('users')
        total_homework = get_count('homework')
        total_assignments = get_count('assignments')
        total_syllabus = get_count('syllabus')
        total_reminders = get_count('reminders')
        
        return jsonify({
            'total_users': total_users,
            'total_tasks': total_homework + total_assignments,
            'total_syllabus': total_syllabus,
            'total_reminders': total_reminders,
            'reviews': [
                {'id': 1, 'name': 'Alex M.', 'rating': 5, 'comment': 'Taskora has completely transformed how I manage my classes!'},
                {'id': 2, 'name': 'Sarah T.', 'rating': 4, 'comment': 'Great study assistant. The countdown feature is fantastic.'},
                {'id': 3, 'name': 'John D.', 'rating': 5, 'comment': 'Best student companion tool out there.'}
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Admin Error: {str(e)}'}), 500
    finally:
        db.close()


@auth_bp.route('/admin/send-bulk-email', methods=['POST'])
@jwt_required()
def admin_send_bulk_email():
    user_id = get_jwt_identity()
    db = get_db()
    try:
        user = db.execute('SELECT email FROM users WHERE id = ?', (user_id,)).fetchone()
        email = user.get('email') if isinstance(user, dict) else user['email'] if user else None
        if email != 'officialtaskora@gmail.com':
            return jsonify({'error': 'Unauthorized access.'}), 403
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        subject = data.get('subject', '').strip()
        body = data.get('body', '').strip()
        
        if not subject or not body:
            return jsonify({'error': 'Subject and body are required'}), 400
            
        email_user = os.environ.get('EMAIL_USER')
        email_pass = os.environ.get('EMAIL_PASS')
        
        if not email_user or not email_pass:
            return jsonify({'error': 'SMTP credentials are not configured on the server.'}), 500
            
        cursor = db.execute('SELECT name, email FROM users')
        users = []
        for row in cursor.fetchall():
            users.append({'name': row['name'], 'email': row['email']})
            
        if not users:
            return jsonify({'message': 'No users found in database.'}), 200
            
        import smtplib
        from email.mime.text import MIMEText
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(email_user, email_pass)
        
        success_count = 0
        fail_count = 0
        
        for u in users:
            if not u['email']:
                continue
            
            # Personalize body if requested
            user_body = body.replace('{{name}}', u['name'])
            
            msg = MIMEText(user_body)
            msg['Subject'] = subject
            msg['From'] = email_user
            msg['To'] = u['email']
            
            try:
                server.send_message(msg)
                success_count += 1
            except Exception:
                fail_count += 1
                
        server.quit()
        return jsonify({
            'message': f'Broadcast completed. Success: {success_count}, Failed: {fail_count}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Admin Error: {str(e)}'}), 500
    finally:
        db.close()


# ── GOOGLE OAUTH ──

@auth_bp.route('/google', methods=['GET'])
def google_login():
    google_client_id = os.environ.get('GOOGLE_CLIENT_ID')
    if not google_client_id:
        return jsonify({'error': 'Google OAuth is not configured on the server.'}), 400
        
    redirect_uri = "https://taskora-0n0l.onrender.com/api/auth/google/callback"
    scope = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
    
    google_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={google_client_id}&redirect_uri={redirect_uri}&"
        f"response_type=code&scope={scope}&access_type=offline&prompt=consent"
    )
    return redirect(google_url)


@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'No code provided'}), 400

    google_client_id = os.environ.get('GOOGLE_CLIENT_ID')
    google_client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    if 'https://' in frontend_url:
        frontend_url = 'https://' + frontend_url.split('https://')[-1].strip('/')
    elif 'http://' in frontend_url:
        frontend_url = 'http://' + frontend_url.split('http://')[-1].strip('/')
    else:
        frontend_url = 'https://' + frontend_url.strip('/')
    redirect_uri = "https://taskora-0n0l.onrender.com/api/auth/google/callback"

    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        'code': code,
        'client_id': google_client_id,
        'client_secret': google_client_secret,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    
    try:
        token_res = requests.post(token_url, data=payload).json()
        access_token = token_res.get('access_token')
        
        info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
        user_info = requests.get(info_url).json()
        
        email = user_info.get('email')
        name = user_info.get('name')
        
        if not email:
            return jsonify({'error': 'Email not provided by Google'}), 400
            
        db = get_db()
        try:
            user = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
            if not user:
                hashed_pass = generate_password_hash(os.urandom(24).hex())
                cursor = db.execute(
                    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                    (name, email, hashed_pass)
                )
                user_id = cursor.lastrowid
                db.commit()
            else:
                user_id = user['id']
                
            taskora_token = create_access_token(identity=str(user_id))
            return redirect(f"{frontend_url}/oauth-callback?token={taskora_token}")
        finally:
            db.close()
            
    except Exception as e:
        return jsonify({'error': f'OAuth Exception: {str(e)}'}), 500


# ── GITHUB OAUTH ──

@auth_bp.route('/github', methods=['GET'])
def github_login():
    github_client_id = os.environ.get('GITHUB_CLIENT_ID')
    if not github_client_id:
        return jsonify({'error': 'GitHub OAuth is not configured on the server.'}), 400
        
    redirect_uri = "https://taskora-0n0l.onrender.com/api/auth/github/callback"
    github_url = f"https://github.com/login/oauth/authorize?client_id={github_client_id}&redirect_uri={redirect_uri}&scope=user:email"
    
    return redirect(github_url)


@auth_bp.route('/github/callback', methods=['GET'])
def github_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'No code provided'}), 400

    github_client_id = os.environ.get('GITHUB_CLIENT_ID')
    github_client_secret = os.environ.get('GITHUB_CLIENT_SECRET')
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    if 'https://' in frontend_url:
        frontend_url = 'https://' + frontend_url.split('https://')[-1].strip('/')
    elif 'http://' in frontend_url:
        frontend_url = 'http://' + frontend_url.split('http://')[-1].strip('/')
    else:
        frontend_url = 'https://' + frontend_url.strip('/')
    redirect_uri = "https://taskora-0n0l.onrender.com/api/auth/github/callback"

    token_url = "https://github.com/login/oauth/access_token"
    headers = {'Accept': 'application/json'}
    payload = {
        'client_id': github_client_id,
        'client_secret': github_client_secret,
        'code': code,
        'redirect_uri': redirect_uri
    }
    
    try:
        token_res = requests.post(token_url, headers=headers, data=payload).json()
        access_token = token_res.get('access_token')
        
        user_url = "https://api.github.com/user"
        user_headers = {'Authorization': f'token {access_token}'}
        user_info = requests.get(user_url, headers=user_headers).json()
        
        email = user_info.get('email')
        if not email:
            email_url = "https://api.github.com/user/emails"
            emails_res = requests.get(email_url, headers=user_headers).json()
            primary_email = next((e['email'] for e in emails_res if e.get('primary')), None)
            email = primary_email if primary_email else emails_res[0]['email']
            
        name = user_info.get('name') or user_info.get('login')
        
        db = get_db()
        try:
            user = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
            if not user:
                hashed_pass = generate_password_hash(os.urandom(24).hex())
                cursor = db.execute(
                    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                    (name, email, hashed_pass)
                )
                user_id = cursor.lastrowid
                db.commit()
            else:
                user_id = user['id']
                
            taskora_token = create_access_token(identity=str(user_id))
            return redirect(f"{frontend_url}/oauth-callback?token={taskora_token}")
        finally:
            db.close()
            
    except Exception as e:
        return jsonify({'error': f'OAuth Exception: {str(e)}'}), 500
