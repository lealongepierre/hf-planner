# Hellfest Planner

A web application for planning your Hellfest 2026 concert attendance.

**Live:** https://nessie-cooper.fr (this is my cat's name)

> **Note:** ⚠️ Right now, concerts and concert times are those that were published on March 24th, 2026. They will be updated as soon as possible in the case of changes.

## Features

- User authentication (sign up and sign in with JWT tokens)
- Browse festival concert lineup
- Filter concerts by day and stage
- Mark concerts as favorites
- View personalized festival agenda
- Concert calendar with by-stage, favorites, and shared-favorites views
- Overlay friends' favorites on the calendar with a color legend
- One designated user (configurable via `RATER_USERNAME`) can assign a score (0–20) to each concert, visible to all users on the concerts list, favorites, and calendar views

## Experimentation

For learning purposes, this repo contains two deployment explorations that are not intended for production use:

- **Cloud Run** — the `deploy/cloud-run` branch contains a Cloud Run deployment setup (not to be merged into main)
- **Kubernetes** — the `k8s/` directory contains Kubernetes manifests, also kept for reference only

## Roadmap

- Let users delete their account
- Link each concert to the band's Spotify page
- Make iOS and Android applications
- Let users add other types of items (than concerts) to the personal calendar (e.g. shower time, nap...)
- Handle forgotten password, let users change their password

## Tech Stack

**Backend:**
- FastAPI - Modern Python web framework
- SQLModel - SQL database ORM based on Pydantic
- PostgreSQL - Database
- Alembic - Database migrations
- JWT - Authentication
- Poetry - Dependency management

**Frontend:**
- React 19 with TypeScript
- Vite - Build tool and dev server

## Project Structure

```
backend/
├── app/
│   ├── core/           # Configuration and security
│   ├── database/       # Database connection
│   ├── models/         # SQLModel database models
│   ├── routers/        # API endpoints
│   ├── schemas/        # Pydantic schemas
│   ├── utils/          # Utility scripts (seed data)
│   └── main.py         # FastAPI application
├── alembic/            # Database migrations
└── pyproject.toml      # Poetry dependencies
frontend/
├── src/
│   ├── api/            # API client functions
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
└── package.json
justfile                # Common commands
```

## ⚡ Quick Local Setup

> **Prerequisites:** Docker and [Just](https://github.com/casey/just)

```bash
just docker-up    # start all services
just db-migrate   # run migrations
just db-seed      # load concert data
```

Then open **http://localhost** — sign up with any username/password, no access code required.

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- [Just](https://github.com/casey/just) (command runner)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hf-planner
```

2. Start all services (backend, frontend, database):
```bash
just docker-up
```

3. Run database migrations and seed data:
```bash
just db-migrate
just db-seed
```

The app is now running at http://localhost (frontend) and http://localhost:8000 (backend API).

### Starting from scratch

To wipe everything and start clean:
```bash
just docker-clean  # removes all containers and volumes
just docker-up
just db-migrate
just db-seed
```

### Other useful commands

```bash
just docker-down      # stop all services
just docker-logs      # view logs for all services
just db-reset         # reset database and reseed
just test-backend     # run backend tests
just test-frontend    # run frontend tests
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Create new user account
- `POST /api/v1/auth/signin` - Login and get JWT token

### Config
- `GET /api/v1/config` - Get public app configuration (e.g. `rater_username`)

### Concerts
- `GET /api/v1/concerts` - Get all concerts (supports ?day= and ?stage= filters)
- `GET /api/v1/concerts/{id}` - Get specific concert
- `PATCH /api/v1/concerts/{id}/rating` - Set or clear a concert rating (rater only)

### Favorites (Requires Authentication)
- `POST /api/v1/favorites` - Add concert to favorites
- `DELETE /api/v1/favorites/{concert_id}` - Remove from favorites
- `GET /api/v1/favorites` - Get user's favorite concerts

## Database Models

### User
- id (Primary Key)
- username (Unique)
- hashed_password
- created_at

### Concert
- id (Primary Key)
- band_name
- day (Thursday, Friday, Saturday, Sunday)
- festival_day (optional override for the display day)
- start_time
- end_time
- stage (Mainstage 1, Mainstage 2, The Altar, The Warzone, The Temple, etc.)
- rating (optional, 0–20, set by the designated rater)

### Favorite
- id (Primary Key)
- user_id (Foreign Key → User)
- concert_id (Foreign Key → Concert)
- Unique constraint on (user_id, concert_id)

## Development

### Environment Variables

Copy [.env.example](backend/.env.example) to `.env` and configure:

```env
DATABASE_URL=postgresql://hfplanner:hfplanner@localhost:5432/hfplanner
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
SIGNUP_ACCESS_CODE=         # leave empty for open signup
RATER_USERNAME=Wesker        # username allowed to set concert ratings
```

`RATER_USERNAME` controls which account can assign scores (0–20) to concerts. The value is exposed publicly via `GET /api/v1/config` (it appears in the UI as "X's rating"), so it must not be a secret. To test the rating feature locally under your own account, set `RATER_USERNAME=<your username>`.

### Running Tests

```bash
just test-backend
just test-frontend
```

## VM + Docker Compose Deployment

### Architecture

```
Internet → GCE VM (public IP)
  → Caddy (:443/:80) reverse proxy with auto HTTPS
    → / → Frontend (nginx) → static React files
    → /api → Backend (FastAPI) → PostgreSQL
```

All services run on a single VM via Docker Compose. Caddy handles HTTPS with automatic Let's Encrypt certificates.

### Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and configured

### 1. Create GCE VM

```bash
gcloud compute instances create hf-planner-vm \
  --zone=europe-west1-b \
  --machine-type=e2-small \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server

# Open firewall for HTTP/HTTPS
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 --target-tags http-server
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 --target-tags https-server
```

### 2. VM Setup

```bash
# SSH into the VM
gcloud compute ssh hf-planner-vm --zone=europe-west1-b

# Install Docker, Docker Compose, and git
sudo apt-get update && sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"

# Log out and back in for docker group to take effect
exit
gcloud compute ssh hf-planner-vm --zone=europe-west1-b
```

### 3. Clone and Configure

For a private repo, set up an SSH key on the VM first:

```bash
# Generate SSH key for GitHub
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
# Add this public key at https://github.com/settings/keys

# Clone and checkout
git clone git@github.com:<your-user>/hf-planner.git ~/hf-planner
cd ~/hf-planner
git checkout main

# Create production .env from template and fill in secrets
cp .env.example.prod .env
nano .env  # Set POSTGRES_PASSWORD, JWT_SECRET_KEY (use: openssl rand -hex 32)
```

### 4. SSH Key for GitHub Actions

```bash
# On the VM, generate a deploy key
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys

# Copy the private key to add as GitHub secret
cat ~/.ssh/deploy_key
```

### 5. GitHub Secrets

| Secret | Value |
|--------|-------|
| `VM_SSH_KEY` | Private key from step 4 |
| `VM_HOST` | VM's external IP (`gcloud compute instances describe hf-planner-vm --zone=europe-west1-b --format='get(networkInterfaces[0].accessConfigs[0].natIP)'`) |
| `VM_USER` | Your SSH username on the VM |

### 6. Deploy

```bash
# First time: start manually on the VM
cd ~/hf-planner
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose -f docker-compose.prod.yml exec backend python -m app.utils.seed

# Subsequent deployments via GitHub Actions
gh workflow run "Deploy to VM" --ref main
```

### Cost Management

- `e2-small` (2 vCPU, 2GB): ~$13/month
- `e2-micro` (free tier, 0.25 vCPU, 1GB): ~$6/month or free
- Boot disk 20GB: ~$0.80/month

```bash
# Stop VM when not in use
gcloud compute instances stop hf-planner-vm --zone=europe-west1-b

# Restart when needed
gcloud compute instances start hf-planner-vm --zone=europe-west1-b
```

## License

MIT
