#!/usr/bin/env python3
"""
Video Migration Script
Downloads videos from Google Drive, converts to HLS, uploads to Cloudflare Stream.
Saves results to JSON file for later database update.
"""

import os
import sys
import json
import time
import logging
import subprocess
import requests
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/root/migration/migration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
CONFIG = {
    'gdrive_remote': 'gdrive',
    'gdrive_path': '_Organizar/Pastas Existentes/black ops/Black Ops (2025-2026)',
    'cloudflare_account_id': os.getenv('CLOUDFLARE_ACCOUNT_ID', ''),
    'cloudflare_api_token': os.getenv('CLOUDFLARE_API_TOKEN', 'SUBSTITUA_AQUI'),
    'download_dir': '/root/migration/downloads',
    'hls_output_dir': '/root/migration/hls',
    'results_file': '/root/migration/migration_results.json',
}

class VideoMigrator:
    def __init__(self):
        self.setup_directories()
        self.results = self.load_results()
        
    def setup_directories(self):
        """Create necessary directories"""
        for dir_path in [CONFIG['download_dir'], CONFIG['hls_output_dir']]:
            os.makedirs(dir_path, exist_ok=True)
            logger.info(f"Directory ready: {dir_path}")
    
    def load_results(self):
        """Load existing results from file"""
        try:
            if os.path.exists(CONFIG['results_file']):
                with open(CONFIG['results_file'], 'r') as f:
                    return json.load(f)
        except:
            pass
        return {}
    
    def save_results(self):
        """Save results to file"""
        with open(CONFIG['results_file'], 'w') as f:
            json.dump(self.results, f, indent=2)
    
    def list_gdrive_videos(self):
        """List all video files from Google Drive folder"""
        try:
            cmd = [
                'rclone', 'lsjson',
                f"{CONFIG['gdrive_remote']}:{CONFIG['gdrive_path']}",
                '--include', '*Recording*',
                '--max-depth', '3'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            if result.returncode != 0:
                logger.error(f"rclone list error: {result.stderr}")
                return []
            
            all_items = json.loads(result.stdout)
            # Filter only video files (not directories) and normalize keys
            files = []
            for f in all_items:
                if not f.get('IsDir', False) and f.get('Size', 0) > 1000:
                    # Normalize keys to lowercase
                    normalized = {
                        'name': f.get('Name', ''),
                        'path': f.get('Path', ''),
                        'size': f.get('Size', 0),
                        'id': f.get('ID', ''),
                        'mod_time': f.get('ModTime', '')
                    }
                    files.append(normalized)
            logger.info(f"Found {len(files)} recording files in Google Drive")
            return files
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return []
    
    def download_video(self, file_info):
        """Download a single video from Google Drive"""
        try:
            filename = file_info['name']
            file_path = file_info.get('path', filename)
            
            # Create a safe filename for local storage - replace problematic characters
            safe_filename = filename
            for old, new in [(':', '-'), ('/', '-'), ('\\', '-'), ('｜', '-'), ('？', '?'), ('*', '_'), ('"', '_'), ('<', '_'), ('>', '_'), ('|', '_')]:
                safe_filename = safe_filename.replace(old, new)
            # Also replace full-width characters
            safe_filename = safe_filename.replace('／', '-').replace('：', '-').replace('？', '?')
            # Limit filename length
            if len(safe_filename) > 200:
                safe_filename = safe_filename[:200]
            
            dest = os.path.join(CONFIG['download_dir'], safe_filename)
            
            # Check if already downloaded
            if os.path.exists(dest) and os.path.getsize(dest) > 1000:
                logger.info(f"File already downloaded: {safe_filename}")
                return dest
            
            # Use rclone copy with specific file path
            source = f"{CONFIG['gdrive_remote']}:{CONFIG['gdrive_path']}/{file_path}"
            logger.info(f"Downloading: {file_path}")
            
            # Download to a temp directory first
            temp_dir = os.path.join(CONFIG['download_dir'], 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            
            # Clean temp directory first
            for f in os.listdir(temp_dir):
                os.remove(os.path.join(temp_dir, f))
            
            cmd = ['rclone', 'copy', source, temp_dir, '--progress', '-v']
            
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # Monitor download progress
            start_time = time.time()
            while True:
                output = process.stderr.readline()
                if output and ('Transferred' in output or 'ETA' in output or 'Copying' in output):
                    elapsed = time.time() - start_time
                    logger.info(f"Download progress ({elapsed:.0f}s): {output.strip()}")
                if process.poll() is not None:
                    break
            
            if process.returncode != 0:
                stderr = process.stderr.read()
                logger.error(f"Download failed for {filename}: {stderr[-500:]}")
                return None
            
            # Find the downloaded file in temp directory
            downloaded_files = os.listdir(temp_dir)
            if downloaded_files:
                src_file = os.path.join(temp_dir, downloaded_files[0])
                os.rename(src_file, dest)
                file_size = os.path.getsize(dest)
                logger.info(f"Downloaded: {safe_filename} ({file_size/1024/1024:.1f} MB)")
                return dest
            else:
                logger.error(f"File not found after download in {temp_dir}")
                return None
        except Exception as e:
            logger.error(f"Download error for {filename}: {e}")
            return None
    
    def convert_to_hls(self, input_path, filename):
        """Convert video to HLS format"""
        try:
            # Create output directory for this video
            video_name = Path(filename).stem.replace(' ', '_').replace(':', '-').replace('/', '-')
            hls_dir = os.path.join(CONFIG['hls_output_dir'], video_name)
            os.makedirs(hls_dir, exist_ok=True)
            
            output_path = os.path.join(hls_dir, 'playlist.m3u8')
            
            # Check if already converted
            if os.path.exists(output_path) and os.path.exists(os.path.join(hls_dir, 'segment_000.ts')):
                logger.info(f"Already converted: {filename}")
                return hls_dir
            
            logger.info(f"Converting to HLS: {filename}")
            start_time = time.time()
            
            # FFmpeg command for HLS conversion with multiple quality levels
            cmd = [
                'ffmpeg', '-i', input_path,
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-hls_time', '10',
                '-hls_list_size', '0',
                '-hls_segment_filename', os.path.join(hls_dir, 'segment_%03d.ts'),
                '-y',  # Overwrite output
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            elapsed = time.time() - start_time
            
            if result.returncode != 0:
                logger.error(f"FFmpeg error for {filename}: {result.stderr[-500:]}")
                return None
            
            # Verify output
            if os.path.exists(output_path):
                segment_count = len([f for f in os.listdir(hls_dir) if f.endswith('.ts')])
                logger.info(f"Converted: {filename} -> {hls_dir} ({segment_count} segments, {elapsed:.0f}s)")
                return hls_dir
            else:
                logger.error(f"HLS output not found for {filename}")
                return None
        except Exception as e:
            logger.error(f"Conversion error for {filename}: {e}")
            return None
    
    def upload_to_cloudflare(self, hls_dir, filename, file_path):
        """Upload video to Cloudflare Stream"""
        try:
            video_name = Path(filename).stem
            
            # For simplicity, we'll upload the original file directly
            # Cloudflare Stream handles HLS conversion itself
            original_file = file_path
            
            if not os.path.exists(original_file):
                logger.error(f"Original file not found: {original_file}")
                return None
            
            file_size = os.path.getsize(original_file)
            logger.info(f"Uploading to Cloudflare: {filename} ({file_size/1024/1024:.1f} MB)")
            
            # Step 1: Create a Direct Upload URL
            create_url = f"https://api.cloudflare.com/client/v4/accounts/{CONFIG['cloudflare_account_id']}/stream/direct_upload"
            
            headers = {
                'Authorization': f"Bearer {CONFIG['cloudflare_api_token']}",
                'Content-Type': 'application/json'
            }
            
            # Get video duration using ffprobe
            duration = self.get_video_duration(original_file)
            
            payload = {
                'maxDurationSeconds': int(duration) + 60 if duration else 7200,
                'requireSignedURLs': False,
                'allowedOrigins': ['*']
            }
            
            response = requests.post(create_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Failed to create upload URL: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            upload_url = data['result']['uploadURL']
            video_uid = data['result']['uid']
            
            logger.info(f"Created upload URL for {filename}, video UID: {video_uid}")
            
            # Step 2: Upload the video file using tus protocol
            with open(original_file, 'rb') as f:
                upload_headers = {
                    'Tus-Resumable': '1.0.0',
                    'Upload-Length': str(file_size),
                    'Content-Type': 'application/offset+octet-stream'
                }
                
                # Upload in chunks for large files
                chunk_size = 50 * 1024 * 1024  # 50MB chunks
                offset = 0
                
                while offset < file_size:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    
                    upload_headers['Upload-Offset'] = str(offset)
                    
                    upload_response = requests.patch(
                        upload_url,
                        headers=upload_headers,
                        data=chunk,
                        timeout=300
                    )
                    
                    if upload_response.status_code not in [200, 204]:
                        logger.error(f"Upload failed at offset {offset}: {upload_response.text}")
                        return None
                    
                    offset += len(chunk)
                    logger.info(f"Uploaded {offset/1024/1024:.1f}/{file_size/1024/1024:.1f} MB")
            
            logger.info(f"Upload complete, waiting for processing: {video_uid}")
            
            # Step 3: Wait for video to be ready
            playback_url = self.wait_for_video_ready(video_uid)
            
            if playback_url:
                result = {
                    'video_id': video_uid,
                    'playback_url': playback_url,
                    'hls_url': f"https://customer-{CONFIG['cloudflare_account_id']}.cloudflarestream.com/{video_uid}/manifest/video.m3u8",
                    'dash_url': f"https://customer-{CONFIG['cloudflare_account_id']}.cloudflarestream.com/{video_uid}/manifest/video.mpd",
                    'thumbnail_url': f"https://customer-{CONFIG['cloudflare_account_id']}.cloudflarestream.com/{video_uid}/thumbnails/thumbnail.jpg",
                    'embed_url': f"https://customer-{CONFIG['cloudflare_account_id']}.cloudflarestream.com/{video_uid}/iframe",
                }
                logger.info(f"Uploaded successfully: {filename} -> {playback_url}")
                return result
            
            return None
        except Exception as e:
            logger.error(f"Upload error for {filename}: {e}")
            return None
    
    def get_video_duration(self, video_path):
        """Get video duration using ffprobe"""
        try:
            cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', video_path]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                return float(result.stdout.strip())
        except:
            pass
        return None
    
    def wait_for_video_ready(self, video_uid, timeout=600):
        """Wait for Cloudflare video to be ready"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                url = f"https://api.cloudflare.com/client/v4/accounts/{CONFIG['cloudflare_account_id']}/stream/{video_uid}"
                headers = {
                    'Authorization': f"Bearer {CONFIG['cloudflare_api_token']}"
                }
                
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    status = data['result']['status']['state']
                    
                    if status == 'ready':
                        return data['result']['playback']['hls']
                    elif status == 'error':
                        logger.error(f"Video processing error: {data['result']['status']}")
                        return None
                    
                    logger.info(f"Video status: {status}")
                
                time.sleep(15)
            except Exception as e:
                logger.error(f"Status check error: {e}")
                time.sleep(15)
        
        logger.error(f"Timeout waiting for video {video_uid}")
        return None
    
    def cleanup_files(self, filename):
        """Clean up downloaded and converted files"""
        try:
            # Create safe filename using same logic as download
            safe_filename = filename
            for old, new in [(':', '-'), ('/', '-'), ('\\', '-'), ('｜', '-'), ('？', '?'), ('*', '_'), ('"', '_'), ('<', '_'), ('>', '_'), ('|', '_')]:
                safe_filename = safe_filename.replace(old, new)
            safe_filename = safe_filename.replace('／', '-').replace('：', '-').replace('？', '?')
            if len(safe_filename) > 200:
                safe_filename = safe_filename[:200]
            
            # Remove downloaded file
            download_path = os.path.join(CONFIG['download_dir'], safe_filename)
            if os.path.exists(download_path):
                os.remove(download_path)
                logger.info(f"Removed download: {safe_filename}")
            
            # Remove HLS directory
            video_name = Path(safe_filename).stem
            hls_dir = os.path.join(CONFIG['hls_output_dir'], video_name)
            if os.path.exists(hls_dir):
                import shutil
                shutil.rmtree(hls_dir)
                logger.info(f"Removed HLS directory: {video_name}")
        except Exception as e:
            logger.error(f"Cleanup error for {filename}: {e}")
    
    def process_video(self, file_info):
        """Process a single video through the entire pipeline"""
        filename = file_info['name']
        file_size = file_info.get('size', 0)
        
        logger.info(f"{'='*60}")
        logger.info(f"Processing: {filename}")
        logger.info(f"Size: {file_size/1024/1024:.1f} MB")
        logger.info(f"{'='*60}")
        
        # Check if already processed
        if filename in self.results and self.results[filename].get('status') == 'completed':
            logger.info(f"Skipping - already processed: {filename}")
            return True
        
        # Step 1: Download
        download_path = self.download_video(file_info)
        if not download_path:
            self.results[filename] = {'status': 'download_failed', 'timestamp': datetime.now().isoformat()}
            self.save_results()
            return False
        
        # Step 2: Upload to Cloudflare
        video_data = self.upload_to_cloudflare(None, filename, download_path)
        if not video_data:
            self.results[filename] = {'status': 'upload_failed', 'timestamp': datetime.now().isoformat()}
            self.save_results()
            return False
        
        # Step 3: Save results
        self.results[filename] = {
            'status': 'completed',
            'timestamp': datetime.now().isoformat(),
            'file_size': file_size,
            'original_path': file_info.get('path', filename),
            'gdrive_id': file_info.get('id', ''),
            **video_data
        }
        self.save_results()
        
        # Step 4: Cleanup
        self.cleanup_files(filename)
        
        logger.info(f"✓ Completed: {filename}")
        return True
    
    def run(self):
        """Main execution method"""
        logger.info("="*60)
        logger.info("Starting Video Migration")
        logger.info(f"Time: {datetime.now().isoformat()}")
        logger.info("="*60)
        
        start_time = time.time()
        
        # List videos from Google Drive
        videos = self.list_gdrive_videos()
        
        if not videos:
            logger.error("No videos found in Google Drive")
            return
        
        logger.info(f"Found {len(videos)} videos to process")
        
        # Filter out already completed videos
        videos_to_process = [v for v in videos if v['name'] not in self.results or self.results[v['name']].get('status') != 'completed']
        logger.info(f"Videos remaining: {len(videos_to_process)}")
        
        # Process each video
        success_count = 0
        failed_count = 0
        failed_videos = []
        
        for i, video in enumerate(videos_to_process, 1):
            logger.info(f"\nProgress: {i}/{len(videos_to_process)}")
            
            try:
                if self.process_video(video):
                    success_count += 1
                else:
                    failed_count += 1
                    failed_videos.append(video['name'])
            except Exception as e:
                logger.error(f"Unexpected error processing {video['name']}: {e}")
                failed_count += 1
                failed_videos.append(video['name'])
                self.results[video['name']] = {'status': 'error', 'error': str(e), 'timestamp': datetime.now().isoformat()}
                self.save_results()
        
        # Summary
        elapsed_time = time.time() - start_time
        logger.info("\n" + "="*60)
        logger.info("Migration Complete!")
        logger.info("="*60)
        logger.info(f"Total videos: {len(videos)}")
        logger.info(f"Successful: {success_count}")
        logger.info(f"Failed: {failed_count}")
        logger.info(f"Time elapsed: {elapsed_time/60:.2f} minutes")
        
        if failed_videos:
            logger.info("\nFailed videos:")
            for video in failed_videos:
                logger.info(f"  - {video}")
        
        # Save summary
        summary = {
            'total': len(videos),
            'success': success_count,
            'failed': failed_count,
            'elapsed_time': elapsed_time,
            'failed_videos': failed_videos,
            'timestamp': datetime.now().isoformat()
        }
        
        with open('/root/migration/migration_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"\nResults saved to: {CONFIG['results_file']}")

if __name__ == '__main__':
    migrator = VideoMigrator()
    migrator.run()
