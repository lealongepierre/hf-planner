# Hellfest Planner

A web application for planning your concert attendance at music festivals. Built with Python, FastAPI, and PostgreSQL.

## Features

- User authentication (sign up and sign in with JWT tokens)
- Browse festival concert lineup
- Filter concerts by day and stage
- Mark concerts as favorites
- View personalized festival agenda

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

### Concerts
- `GET /api/v1/concerts` - Get all concerts (supports ?day= and ?stage= filters)
- `GET /api/v1/concerts/{id}` - Get specific concert

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
```

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

# Run the setup script (installs Docker, git)
curl -sSL https://raw.githubusercontent.com/<your-user>/hf-planner/deploy/vm-docker-compose/scripts/vm-setup.sh | bash

# Log out and back in for docker group to take effect
exit
gcloud compute ssh hf-planner-vm --zone=europe-west1-b
```

### 3. Clone and Configure

```bash
git clone <repository-url> ~/hf-planner
cd ~/hf-planner
git checkout deploy/vm-docker-compose

# Create production .env from template
cp .env.example.prod .env
nano .env  # Set POSTGRES_PASSWORD, JWT_SECRET_KEY, DOMAIN
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
gh workflow run "Deploy to VM" --ref deploy/vm-docker-compose
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
