from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import get_db
import urllib.request
import urllib.parse
import json
import re

study_bp = Blueprint('study', __name__)


@study_bp.route('/search', methods=['GET'])
@jwt_required()
def search_videos():
    """Search YouTube for study videos based on topic and language."""
    topic = request.args.get('topic', '').strip()
    language = request.args.get('language', 'English').strip()

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    query = f"{topic} {language} tutorial lecture"
    
    try:
        encoded_query = urllib.parse.quote(query)
        url = f"https://www.youtube.com/results?search_query={encoded_query}"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        match = re.search(r'var ytInitialData = (\{.*?\});</script>', html)
        if not match:
            return jsonify({'videos': [], 'experts': []}), 200
            
        data = json.loads(match.group(1))
        videos = []
        channels = {}
        
        contents = data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents']
        for item in contents:
            if 'videoRenderer' in item:
                v = item['videoRenderer']
                try:
                    title = v['title']['runs'][0]['text']
                    video_id = v['videoId']
                    channel_name = v['ownerText']['runs'][0]['text']
                    duration = v.get('lengthText', {}).get('simpleText', '0:00')
                    views = v.get('viewCountText', {}).get('simpleText', '0 views')
                    thumbnails = v['thumbnail']['thumbnails']
                    thumbnail = thumbnails[-1]['url'] if thumbnails else ''
                    
                    videos.append({
                        'id': video_id,
                        'title': title,
                        'channel': channel_name,
                        'duration': duration,
                        'views': views,
                        'thumbnail': thumbnail
                    })
                    
                    if channel_name not in channels:
                        channels[channel_name] = 0
                    channels[channel_name] += 1
                    
                    if len(videos) >= 10:
                        break
                except Exception:
                    pass
        
        # Sort channels by frequency to suggest "experts"
        experts = sorted(channels.keys(), key=lambda k: channels[k], reverse=True)[:3]

        return jsonify({
            'videos': videos,
            'experts': experts
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@study_bp.route('/notes/<video_id>', methods=['GET'])
@jwt_required()
def get_notes(video_id):
    """Get notes for a specific video."""
    user_id = get_jwt_identity()
    db = get_db()
    try:
        notes = db.execute(
            'SELECT * FROM notes WHERE user_id = ? AND video_id = ? ORDER BY created_at DESC',
            (user_id, video_id)
        ).fetchall()
        return jsonify({'notes': [dict(n) for n in notes]}), 200
    finally:
        db.close()


@study_bp.route('/notes', methods=['POST'])
@jwt_required()
def save_note():
    """Save or update a note for a video."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    video_id = data.get('video_id', '').strip()
    topic = data.get('topic', '').strip()
    content = data.get('content', '').strip()

    if not video_id:
        return jsonify({'error': 'Video ID is required'}), 400

    db = get_db()
    try:
        # Check if note exists for this video
        existing = db.execute(
            'SELECT id FROM notes WHERE user_id = ? AND video_id = ?',
            (user_id, video_id)
        ).fetchone()

        if existing:
            db.execute(
                'UPDATE notes SET content = ?, topic = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                (content, topic, existing['id'])
            )
        else:
            db.execute(
                'INSERT INTO notes (user_id, video_id, topic, content) VALUES (?, ?, ?, ?)',
                (user_id, video_id, topic, content)
            )
            
        db.commit()
        return jsonify({'message': 'Note saved successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@study_bp.route('/summarize/<video_id>', methods=['GET'])
@jwt_required()
def summarize_video(video_id):
    """Fetch video transcript and summarize using Gemini AI."""
    from youtube_transcript_api import YouTubeTranscriptApi
    import google.generativeai as genai
    from config import Config
    import traceback

    # 1. Ensure API Key exists
    if not getattr(Config, 'GEMINI_API_KEY', None) or Config.GEMINI_API_KEY == 'your-gemini-api-key':
        return jsonify({'error': 'AI_KEY_MISSING'}), 400

    # 2. Fetch Transcript
    try:
        ytt_api = YouTubeTranscriptApi() # Required for version 1.2.4
        # 1. Try to list all transcripts for more control
        transcript_list = ytt_api.list(video_id)
        
        # 2. Prefer manually created English, then auto-generated English
        try:
            t_obj = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
        except:
            t_obj = transcript_list.find_generated_transcript(['en', 'en-US', 'en-GB'])
            
        full_transcript = t_obj.fetch()
        transcript_text = " ".join([t['text'] for t in full_transcript])
    except Exception as e:
        # Last resort fallback attempt
        try:
            # Try simple fetch if list fails
            simple_t = ytt_api.fetch(video_id)
            transcript_text = " ".join([t['text'] for t in simple_t])
        except:
            # Last Resort: Scrape the video description if transcript is disabled
            try:
                print(f"Transcript failed for {video_id}. Trying description fallback...")
                url = f"https://www.youtube.com/watch?v={video_id}"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                html = urllib.request.urlopen(req).read().decode('utf-8')
                
                desc_match = re.search(r'"description":\{"simpleText":"(.*?)"\}', html)
                if not desc_match:
                    desc_match = re.search(r'"shortDescription":"(.*?)"', html)
                
                if desc_match:
                    transcript_text = desc_match.group(1).replace('\\n', '\n').replace('\\"', '"')
                    print("Description fallback successful.")
                else:
                    return jsonify({'error': 'TRANSCRIPT_UNAVAILABLE', 'details': str(e)}), 400
            except:
                return jsonify({'error': 'TRANSCRIPT_UNAVAILABLE', 'details': str(e)}), 400

    # 3. Summarize Transcript
    try:
        genai.configure(api_key=Config.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""You are an advanced study assistant. Please summarize the following video transcript.
Extract and format the following beautifully using Markdown:
1. Main Topic & Overview
2. Sections & Key Notes
3. Code Examples & Formulas (if any)
4. Key Takeaways

Transcript:
{transcript_text[:20000]}
"""
        response = model.generate_content(prompt)
        return jsonify({'summary': response.text}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'AI_SUMMARIZE_FAILED', 'details': str(e)}), 500
