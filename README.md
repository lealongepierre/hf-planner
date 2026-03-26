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

## Roadmap

- Let users delete their account
- Link each concert to the band's Spotify page
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
├── pyproject.toml      # Poetry dependencies
├── justfile            # Common commands
└── .env                # Environment variables
```

## Getting Started

### Prerequisites

- Python 3.12+
- Docker and Docker Compose (for PostgreSQL)
- Poetry (Python package manager)
- Just (command runner - optional but recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hf-planner
```

2. Start the PostgreSQL database:
```bash
docker-compose up -d
```

3. Install backend dependencies:
```bash
cd backend
poetry install --no-root
```

4. Run database migrations:
```bash
poetry run alembic upgrade head
```

5. Seed the database with sample concert data:
```bash
poetry run python -m app.utils.seed
```

6. Start the development server:
```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Using Just Commands (Recommended)

If you have [Just](https://github.com/casey/just) installed:

```bash
cd backend

# Start dev server
just run

# Run migrations
just migrate

# Create new migration
just make-migration "description"

# Seed database
just seed

# Run tests
just test

# Format code
just format

# Lint code
just lint

# Reset database
just reset-db
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
- day (Friday, Saturday, Sunday)
- start_time
- end_time
- stage (Mainstage 1, Mainstage 2, The Altar, The Warzone, The Temple, etc.)

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
cd backend
poetry run pytest
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
