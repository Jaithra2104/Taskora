from youtube_transcript_api import YouTubeTranscriptApi
import json

video_id = "MiiANxRHSv4"

try:
    print(f"DEBUGGING VIDEO: {video_id}")
    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
    print("TRANSCRIPTS FOUND:")
    for t in transcript_list:
        print(f"- {t.language} ({t.language_code}) [Manual: {not t.is_generated}]")
    
    # Try finding English
    try:
        t_obj = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
        print("SUCCESS: Found Manual English")
    except:
        print("FAIL: No Manual English")
        try:
            t_obj = transcript_list.find_generated_transcript(['en', 'en-US', 'en-GB'])
            print("SUCCESS: Found Generated English")
        except:
            print("FAIL: No Generated English")

except Exception as e:
    print(f"ERROR: {str(e)}")
