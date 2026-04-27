from youtube_transcript_api import YouTubeTranscriptApi
import json

video_id = "MiiANxRHSv4"

try:
    print(f"DEBUGGING VIDEO: {video_id}")
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    print("SUCCESS: Found Transcript")
    print(transcript[0])
except Exception as e:
    print(f"ERROR: {str(e)}")
