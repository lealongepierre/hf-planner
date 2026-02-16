#!/bin/bash
set -euo pipefail

echo "=== Hellfest Planner VM Setup ==="

# Install Docker (official method for Debian/Ubuntu)
echo "Installing Docker..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker "$USER"

# Install git
echo "Installing git..."
sudo apt-get install -y git

echo ""
echo "=== Setup Complete ==="
echo "Log out and back in for docker group to take effect."
echo ""
echo "Next steps:"
echo "  1. Clone the repo: git clone <repo-url> ~/hf-planner"
echo "  2. Create .env file: cp .env.example.prod .env && nano .env"
echo "  3. Start the app: docker compose -f docker-compose.prod.yml up -d --build"
