#!/bin/bash
# Process videos - handles special chars in filenames

OUTPUT_DIR="/var/www/videos"
API="${API_URL:-https://api-production-28e6.up.railway.app}"
VPS="${VPS_IP:-23.106.44.84}:${STREAM_PORT:-8081}"
EMAIL="${ADMIN_EMAIL:-admin@tropadosdados.com}"
PASSWORD="${ADMIN_PASSWORD}"

mkdir -p "$OUTPUT_DIR"

# Get token
TOKEN=$(curl -s -X POST "$API/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

echo "Token OK: ${TOKEN:0:20}..."

# Find and process videos
find /tmp/tropa-videos/black-ops -type f -name "*Recording*" | while IFS= read -r f; do
  VID=$(echo "$f" | md5sum | cut -c1-8)
  DIR="$OUTPUT_DIR/$VID"
  
  # Skip if already done
  if [ -f "$DIR/playlist.m3u8" ]; then
    echo "Skip: $VID"
    continue
  fi
  
  echo "Processing: $VID"
  echo "File: $f"
  mkdir -p "$DIR"
  
  # Convert with proper quoting
  ffmpeg -i "$f" \
    -c:v libx264 -preset fast -crf 23 \
    -c:a aac -b:a 128k \
    -hls_time 10 -hls_list_size 0 \
    -hls_segment_filename "$DIR/seg_%03d.ts" \
    "$DIR/playlist.m3u8" -y 2>/dev/null
  
  if [ -f "$DIR/playlist.m3u8" ]; then
    echo "OK: http://$VPS/videos/$VID/playlist.m3u8"
    
    # Extract lesson name from path
    NAME=$(basename "$f" | sed 's/ - Recording.*//')
    
    # Find lesson ID
    LID=$(curl -s "$API/v1/content/courses" -H "Authorization: Bearer $TOKEN" | \
      python3 -c "
import sys,json
name='$NAME'.lower()
for c in json.load(sys.stdin):
  for m in c.get('modules',[]):
    for l in m.get('lessons',[]):
      if name in l['title'].lower():
        print(l['id'])
        sys.exit(0)
print('')
" 2>/dev/null)
    
    if [ -n "$LID" ] && [ "$LID" != "" ]; then
      # Update lesson
      curl -s -X PATCH "$API/v1/admin/content/lessons/$LID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"content\":{\"hasVideo\":true,\"videoUid\":\"$VID\",\"streamUrl\":\"http://$VPS/videos/$VID/playlist.m3u8\"}}" > /dev/null 2>&1
      echo "Updated: $NAME -> $LID"
    else
      echo "Not found: $NAME"
    fi
  else
    echo "FAIL: $VID"
  fi
  echo "---"
done

echo "Done!"
