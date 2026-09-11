#!/usr/bin/env python3
"""
Script para sincronizar vídeos do Google Drive para Cloudflare Stream
e atualizar as aulas no banco de dados.

Uso:
    python3 sync-videos.py

Requer:
    - gdown: pip install gdown
    - requests: pip install requests
    - psycopg2: pip install psycopg2-binary
"""

import os
import sys
import json
import time
import logging
import subprocess
import requests
from pathlib import Path
from typing import Optional

# Configuração
DRIVE_FOLDER_ID = "1KF3zRnq8Q-WuwwZEMLJhY-s5meTGy3Wk"
CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
CLOUDFLARE_STREAM_TOKEN = os.getenv("CLOUDFLARE_STREAM_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Diretórios
WORK_DIR = Path("/tmp/tropa-videos")
DOWNLOAD_DIR = WORK_DIR / "downloads"
PROGRESS_FILE = WORK_DIR / "progress.json"

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(WORK_DIR / "sync.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class VideoSync:
    def __init__(self):
        self.progress = self.load_progress()
        WORK_DIR.mkdir(parents=True, exist_ok=True)
        DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    def load_progress(self) -> dict:
        """Carrega progresso do arquivo"""
        if PROGRESS_FILE.exists():
            with open(PROGRESS_FILE) as f:
                return json.load(f)
        return {"completed": [], "failed": [], "in_progress": None}
    
    def save_progress(self):
        """Salva progresso no arquivo"""
        with open(PROGRESS_FILE, 'w') as f:
            json.dump(self.progress, f, indent=2)
    
    def download_all(self) -> bool:
        """Baixa todas as pastas do Drive"""
        logger.info("Baixando todas as pastas do Drive...")
        
        try:
            result = subprocess.run(
                ["gdown", "--folder", f"https://drive.google.com/drive/folders/{DRIVE_FOLDER_ID}", 
                 "-O", str(DOWNLOAD_DIR)],
                capture_output=True, text=True, timeout=7200  # 2 hours
            )
            
            if result.returncode == 0:
                logger.info("Download concluído!")
                return True
            else:
                logger.error(f"Erro no download: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("Timeout no download")
            return False
        except Exception as e:
            logger.error(f"Erro no download: {e}")
            return False
    
    def find_video_files(self) -> list:
        """Encontra todos os arquivos de vídeo"""
        video_extensions = {'.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v'}
        videos = []
        
        for file_path in DOWNLOAD_DIR.rglob('*'):
            if file_path.suffix.lower() in video_extensions:
                videos.append(file_path)
        
        return videos
    
    def upload_to_cloudflare(self, video_path: Path, lesson_name: str) -> Optional[str]:
        """Faz upload do vídeo para Cloudflare Stream via TUS"""
        logger.info(f"Enviando para Cloudflare: {video_path.name}")
        
        if not CLOUDFLARE_STREAM_TOKEN:
            logger.error("CLOUDFLARE_STREAM_TOKEN não configurado")
            return None
        
        # Step 1: Create upload ticket
        try:
            response = requests.post(
                f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload",
                headers={
                    "Authorization": f"Bearer {CLOUDFLARE_STREAM_TOKEN}",
                    "Content-Type": "application/json"
                },
                json={
                    "name": lesson_name,
                    "maxDurationSeconds": 7200,  # 2 hours
                    "requireSignedURLs": True
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Erro ao criar ticket: {response.text}")
                return None
            
            data = response.json()
            if not data.get('success'):
                logger.error(f"Erro na API: {data}")
                return None
            
            upload_url = data['result']['uploadURL']
            video_uid = data['result']['uid']
            
            logger.info(f"Ticket criado: {video_uid}")
            
        except Exception as e:
            logger.error(f"Erro ao criar ticket: {e}")
            return None
        
        # Step 2: Upload file using TUS
        try:
            file_size = video_path.stat().st_size
            logger.info(f"Tamanho do arquivo: {file_size / (1024*1024):.1f} MB")
            
            # Use tuspy for TUS upload
            from tusclient import client
            from tusclient.fingerprint import fingerprint
            
            tus_client = client.TusClient(upload_url)
            uploader = tus_client.uploader(
                str(video_path),
                metadata={
                    "filename": video_path.name,
                    "name": lesson_name
                }
            )
            
            uploader.upload()
            logger.info(f"Upload concluído: {video_uid}")
            
            return video_uid
            
        except ImportError:
            logger.error("tuspy não instalado. Instale com: pip install tuspy")
            return None
        except Exception as e:
            logger.error(f"Erro no upload: {e}")
            return None
    
    def update_database(self, lesson_name: str, video_uid: str):
        """Atualiza o banco de dados com o UID do vídeo"""
        logger.info(f"Atualizando banco: {lesson_name} -> {video_uid}")
        
        if not DATABASE_URL:
            logger.warning("DATABASE_URL não configurado, pulando atualização do banco")
            return
        
        try:
            import psycopg2
            
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()
            
            # Find lesson by title pattern
            cur.execute("""
                SELECT l.id FROM "Lesson" l 
                WHERE l.title ILIKE %s
                LIMIT 1
            """, (f"%{lesson_name}%",))
            
            result = cur.fetchone()
            if not result:
                logger.warning(f"Aula não encontrada: {lesson_name}")
                return
            
            lesson_id = result[0]
            
            # Create or update VideoAsset
            cur.execute("""
                INSERT INTO "VideoAsset" (id, "lessonId", provider, "providerUid", status, "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), %s, 'cloudflare_stream', %s, 'ready', NOW(), NOW())
                ON CONFLICT ("lessonId") 
                DO UPDATE SET 
                    "providerUid" = EXCLUDED."providerUid",
                    status = 'ready',
                    "updatedAt" = NOW()
            """, (lesson_id, video_uid))
            
            # Update lesson content to remove placeholder
            cur.execute("""
                UPDATE "Lesson" 
                SET content = content - 'placeholder' || '{"hasVideo": true}'
                WHERE id = %s
            """, (lesson_id,))
            
            conn.commit()
            logger.info(f"Banco atualizado: {lesson_name}")
            
        except Exception as e:
            logger.error(f"Erro ao atualizar banco: {e}")
        finally:
            if 'conn' in locals():
                conn.close()
    
    def sync_all(self):
        """Sincroniza todos os vídeos"""
        logger.info("Iniciando sincronização...")
        
        # Download all folders
        if not self.download_all():
            logger.error("Falha no download")
            return
        
        # Find all videos
        videos = self.find_video_files()
        if not videos:
            logger.warning("Nenhum vídeo encontrado")
            return
        
        logger.info(f"Encontrados {len(videos)} vídeos")
        
        for video_path in videos:
            # Extract lesson name from path
            # Path format: /tmp/tropa-videos/downloads/Black Ops (2025-2026)/2025-11 - APIs WhatsApp e Automação/Recording.mp4
            parts = video_path.relative_to(DOWNLOAD_DIR).parts
            if len(parts) >= 2:
                folder_name = parts[1]  # e.g., "2025-11 - APIs WhatsApp e Automação"
                lesson_name = f"{folder_name} — {video_path.stem}"
            else:
                lesson_name = video_path.stem
            
            if lesson_name in self.progress['completed']:
                logger.info(f"Já processado: {lesson_name}")
                continue
            
            logger.info(f"Processando: {lesson_name}")
            self.progress['in_progress'] = lesson_name
            self.save_progress()
            
            # Upload to Cloudflare
            video_uid = self.upload_to_cloudflare(video_path, lesson_name)
            
            if video_uid:
                self.update_database(lesson_name, video_uid)
                self.progress['completed'].append(lesson_name)
            else:
                self.progress['failed'].append(lesson_name)
            
            self.progress['in_progress'] = None
            self.save_progress()
            
            logger.info(f"Concluído: {lesson_name}")
        
        logger.info("Sincronização concluída!")
        logger.info(f"Concluídas: {len(self.progress['completed'])}")
        logger.info(f"Falhas: {len(self.progress['failed'])}")

if __name__ == "__main__":
    sync = VideoSync()
    sync.sync_all()
