import os
from config import Config

ALLOWED_EXTENSIONS = Config.ALLOWED_EXTENSIONS


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_upload_path(user_id, subfolder='certificates'):
    """Get or create upload directory for a user."""
    path = os.path.join(Config.UPLOAD_FOLDER, str(user_id), subfolder)
    os.makedirs(path, exist_ok=True)
    return path


def get_file_size_mb(file_path):
    """Get file size in MB."""
    if os.path.exists(file_path):
        return round(os.path.getsize(file_path) / (1024 * 1024), 2)
    return 0
