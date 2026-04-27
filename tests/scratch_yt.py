import urllib.request
import urllib.parse
import json
import re

def scrape_youtube(query):
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.youtube.com/results?search_query={encoded_query}"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    
    match = re.search(r'var ytInitialData = (\{.*?\});</script>', html)
    if not match:
        return []
        
    data = json.loads(match.group(1))
    videos = []
    
    try:
        contents = data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents']
        for item in contents:
            if 'videoRenderer' in item:
                v = item['videoRenderer']
                try:
                    title = v['title']['runs'][0]['text']
                    video_id = v['videoId']
                    channel = v['ownerText']['runs'][0]['text']
                    duration = v.get('lengthText', {}).get('simpleText', '0:00')
                    views = v.get('viewCountText', {}).get('simpleText', '0 views')
                    thumbnails = v['thumbnail']['thumbnails']
                    thumbnail = thumbnails[-1]['url'] if thumbnails else ''
                    
                    videos.append({
                        'id': video_id,
                        'title': title,
                        'channel': channel,
                        'duration': duration,
                        'views': views,
                        'thumbnail': thumbnail
                    })
                except Exception as e:
                    pass
    except Exception as e:
        print("PARSE ERROR", e)
    return videos

print(json.dumps(scrape_youtube("Data Analytics lecture in English")[:2], indent=2))
