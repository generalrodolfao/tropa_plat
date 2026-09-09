#!/bin/bash
# VPS Setup Script for Video Migration

set -e

echo "=========================================="
echo "Setting up VPS for Video Migration"
echo "=========================================="

# Update system
apt-get update
apt-get upgrade -y

# Install required packages
apt-get install -y python3 python3-pip python3-venv ffmpeg wget curl

# Create migration directory
mkdir -p /root/migration
cd /root/migration

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install psycopg2-binary requests

# Install rclone
curl https://rclone.org/install.sh | bash

# Configure rclone for Google Drive
echo "Configuring rclone for Google Drive..."
mkdir -p ~/.config/rclone

cat > ~/.config/rclone/rclone.conf << 'EOF'
[gdrive]
type = drive
client_id = 
client_secret = 
scope = drive
token = {"access_token":"placeholder","token_type":"Bearer","refresh_token":"placeholder","expiry":"2024-01-01T00:00:00Z"}
root_folder_id = 1_vCMYQjWjGWYFNTmw_Ds2etaIWkDquR-
EOF

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "IMPORTANT: You need to configure rclone with Google Drive credentials."
echo "Run: rclone config"
echo "Then follow the prompts to set up Google Drive access."
echo ""
echo "After configuration, run the migration script:"
echo "cd /root/migration && python3 vps_migration.py"
