#!/usr/bin/env python3
"""
API de gestão de vídeos para streaming
Executa na VPS e serve vídeos via Nginx
"""

import os
import json
import uuid
import subprocess
import psycopg2
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuração
VIDEO_DIR = "/var/www/videos"
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:REMOVED_SECRET@postgres-production-8d52.up.railway.app:5432/railway")
VPS_IP = "23.106.44.84"
STREAM_PORT = "8081"

os.makedirs(VIDEO_DIR, exist_ok=True)

def get_db():
    """Conecta ao banco de dados"""
    return psycopg2.connect(DB_URL)

def convert_to_hls(input_path, output_dir, video_id):
    """Converte vídeo para HLS"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Comando FFmpeg para converter para HLS
    cmd = [
        'ffmpeg', '-i', input_path,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-hls_time', '10',
        '-hls_list_size', '0',
        '-hls_segment_filename', f'{output_dir}/segment_%03d.ts',
        f'{output_dir}/playlist.m3u8',
        '-y'
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erro na conversão: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({"status": "ok", "service": "video-stream"})

@app.route('/api/videos', methods=['GET'])
def list_videos():
    """Lista todos os vídeos"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT va.id, va."providerUid", va.status, l.title, l.id as lesson_id
            FROM "VideoAsset" va
            JOIN "Lesson" l ON va."lessonId" = l.id
            ORDER BY va."createdAt" DESC
        """)
        
        videos = []
        for row in cur.fetchall():
            videos.append({
                "id": row[0],
                "uid": row[1],
                "status": row[2],
                "title": row[3],
                "lesson_id": row[4],
                "stream_url": f"http://{VPS_IP}:{STREAM_PORT}/videos/{row[1]}/playlist.m3u8"
            })
        
        conn.close()
        return jsonify({"videos": videos})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/videos/upload', methods=['POST'])
def upload_video():
    """Upload de vídeo"""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    lesson_id = request.form.get('lesson_id')
    
    if not lesson_id:
        return jsonify({"error": "lesson_id required"}), 400
    
    # Gerar ID único
    video_id = str(uuid.uuid4())[:8]
    filename = secure_filename(file.filename)
    
    # Salvar arquivo original
    original_path = os.path.join(VIDEO_DIR, f"{video_id}_original{os.path.splitext(filename)[1]}")
    file.save(original_path)
    
    # Converter para HLS
    hls_dir = os.path.join(VIDEO_DIR, video_id)
    if convert_to_hls(original_path, hls_dir, video_id):
        # Atualizar banco de dados
        try:
            conn = get_db()
            cur = conn.cursor()
            
            # Criar VideoAsset
            cur.execute("""
                INSERT INTO "VideoAsset" (id, "lessonId", provider, "providerUid", status, "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), %s, 'self-hosted', %s, 'ready', NOW(), NOW())
                ON CONFLICT ("lessonId") 
                DO UPDATE SET 
                    "providerUid" = EXCLUDED."providerUid",
                    status = 'ready',
                    "updatedAt" = NOW()
            """, (lesson_id, video_id))
            
            # Atualizar lesson content
            cur.execute("""
                UPDATE "Lesson" 
                SET content = content - 'placeholder' || '{"hasVideo": true}'
                WHERE id = %s
            """, (lesson_id,))
            
            conn.commit()
            conn.close()
            
            # Remover arquivo original
            os.remove(original_path)
            
            return jsonify({
                "success": True,
                "video_id": video_id,
                "stream_url": f"http://{VPS_IP}:{STREAM_PORT}/videos/{video_id}/playlist.m3u8"
            })
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Conversion failed"}), 500

@app.route('/api/videos/<video_id>', methods=['DELETE'])
def delete_video(video_id):
    """Deleta vídeo"""
    try:
        # Remover arquivos
        video_path = os.path.join(VIDEO_DIR, video_id)
        if os.path.exists(video_path):
            import shutil
            shutil.rmtree(video_path)
        
        # Remover do banco
        conn = get_db()
        cur = conn.cursor()
        cur.execute('DELETE FROM "VideoAsset" WHERE "providerUid" = %s', (video_id,))
        conn.commit()
        conn.close()
        
        return jsonify({"success": True})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/videos/<path:filename>')
def serve_video(filename):
    """Serve vídeo via Nginx"""
    return send_from_directory(VIDEO_DIR, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
