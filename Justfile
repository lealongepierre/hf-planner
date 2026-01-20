# Hellfest Planner - Just Commands
# Common development and deployment tasks

# Default recipe to show available commands
default:
    @just --list

# ==================== Docker Commands ====================

# Build all Docker images
docker-build:
    docker-compose build

# Start all services with Docker Compose
docker-up:
    docker-compose up -d

# Stop all services
docker-down:
    docker-compose down

# View logs for all services
docker-logs:
    docker-compose logs -f

# View logs for specific service (backend, frontend, postgres)
docker-logs-service service:
    docker-compose logs -f {{service}}

# Restart all services
docker-restart:
    docker-compose restart

# Clean up Docker containers, volumes, and images
docker-clean:
    docker-compose down -v
    docker system prune -f

# ==================== Database Commands ====================

# Run Alembic migrations (Docker)
db-migrate:
    docker-compose exec backend poetry run alembic upgrade head

# Seed database with test data (Docker)
db-seed:
    docker-compose exec backend poetry run python -m app.utils.seed

# Access PostgreSQL shell (Docker)
db-shell:
    docker-compose exec postgres psql -U hfplanner -d hfplanner

# Reset database (drop tables and recreate)
db-reset:
    docker-compose exec postgres psql -U hfplanner -d hfplanner -c "DROP TABLE IF EXISTS favorites CASCADE; DROP TABLE IF EXISTS concerts CASCADE; DROP TABLE IF EXISTS users CASCADE; DROP TABLE IF EXISTS alembic_version CASCADE;"
    docker-compose exec backend poetry run alembic upgrade head
    docker-compose exec backend poetry run python -m app.utils.seed

# ==================== Kubernetes Commands ====================

# Set kubectl context variables
export K8S_NAMESPACE := "hf-planner-dev"
export DOCKERHUB_USER := env_var_or_default("DOCKERHUB_USERNAME", "YOUR_DOCKERHUB_USERNAME")

# Start minikube cluster
k8s-start:
    minikube start --cpus=4 --memory=4096

# Stop minikube cluster
k8s-stop:
    minikube stop

# Delete minikube cluster
k8s-delete:
    minikube delete

# Build and push Docker images to Docker Hub
k8s-build-push:
    #!/usr/bin/env bash
    echo "Building and pushing images for user: ${DOCKERHUB_USER}"
    docker build -t ${DOCKERHUB_USER}/hf-planner-backend:latest ./backend
    docker build -t ${DOCKERHUB_USER}/hf-planner-frontend:latest ./frontend
    docker push ${DOCKERHUB_USER}/hf-planner-backend:latest
    docker push ${DOCKERHUB_USER}/hf-planner-frontend:latest

# Deploy all Kubernetes resources
k8s-deploy:
    kubectl apply -f k8s/dev/namespace.yaml
    kubectl apply -f k8s/dev/postgres-secret.yaml
    kubectl apply -f k8s/dev/postgres-pvc.yaml
    kubectl apply -f k8s/dev/postgres-statefulset.yaml
    kubectl apply -f k8s/dev/postgres-service.yaml
    @echo "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n ${K8S_NAMESPACE} --timeout=120s
    kubectl apply -f k8s/dev/backend-secret.yaml
    kubectl apply -f k8s/dev/backend-configmap.yaml
    kubectl apply -f k8s/dev/backend-deployment.yaml
    kubectl apply -f k8s/dev/backend-service.yaml
    kubectl apply -f k8s/dev/backend-migration-job.yaml
    @echo "Waiting for migration to complete..."
    kubectl wait --for=condition=complete job/backend-migration -n ${K8S_NAMESPACE} --timeout=120s
    kubectl apply -f k8s/dev/frontend-configmap.yaml
    kubectl apply -f k8s/dev/frontend-deployment.yaml
    kubectl apply -f k8s/dev/frontend-service.yaml

# Delete all Kubernetes resources
k8s-undeploy:
    kubectl delete namespace ${K8S_NAMESPACE}

# Get status of all pods
k8s-pods:
    kubectl get pods -n ${K8S_NAMESPACE}

# Get status of all services
k8s-services:
    kubectl get services -n ${K8S_NAMESPACE}

# Get all resources in namespace
k8s-status:
    kubectl get all -n ${K8S_NAMESPACE}

# View logs for backend pods
k8s-logs-backend:
    kubectl logs -n ${K8S_NAMESPACE} -l app=backend --tail=50 -f

# View logs for frontend pods
k8s-logs-frontend:
    kubectl logs -n ${K8S_NAMESPACE} -l app=frontend --tail=50 -f

# View logs for postgres pods
k8s-logs-postgres:
    kubectl logs -n ${K8S_NAMESPACE} -l app=postgres --tail=50 -f

# View logs for migration job
k8s-logs-migration:
    kubectl logs -n ${K8S_NAMESPACE} job/backend-migration

# Restart backend deployment
k8s-restart-backend:
    kubectl rollout restart deployment/backend -n ${K8S_NAMESPACE}
    kubectl rollout status deployment/backend -n ${K8S_NAMESPACE}

# Restart frontend deployment
k8s-restart-frontend:
    kubectl rollout restart deployment/frontend -n ${K8S_NAMESPACE}
    kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE}

# Scale backend deployment
k8s-scale-backend replicas:
    kubectl scale deployment backend -n ${K8S_NAMESPACE} --replicas={{replicas}}

# Scale frontend deployment
k8s-scale-frontend replicas:
    kubectl scale deployment frontend -n ${K8S_NAMESPACE} --replicas={{replicas}}

# Port forward to backend service
k8s-port-backend:
    kubectl port-forward -n ${K8S_NAMESPACE} service/backend-service 8000:8000

# Port forward to frontend service
k8s-port-frontend:
    kubectl port-forward -n ${K8S_NAMESPACE} service/frontend-service 8080:80

# Port forward to PostgreSQL
k8s-port-postgres:
    kubectl port-forward -n ${K8S_NAMESPACE} statefulset/postgres 5432:5432

# Start minikube tunnel (required for LoadBalancer services)
k8s-tunnel:
    minikube tunnel

# Seed database in Kubernetes
k8s-db-seed:
    #!/usr/bin/env bash
    BACKEND_POD=$(kubectl get pods -n ${K8S_NAMESPACE} -l app=backend -o jsonpath='{.items[0].metadata.name}')
    kubectl exec -n ${K8S_NAMESPACE} $BACKEND_POD -- poetry run python -m app.utils.seed

# Access PostgreSQL shell in Kubernetes
k8s-db-shell:
    #!/usr/bin/env bash
    kubectl exec -it -n ${K8S_NAMESPACE} statefulset/postgres -- psql -U hfplanner -d hfplanner

# Complete setup: start minikube, build, push, and deploy
k8s-setup: k8s-start k8s-build-push k8s-deploy
    @echo "Kubernetes setup complete!"
    @echo "Run 'just k8s-tunnel' in a separate terminal to access the application"

# Update deployment with new images
k8s-update: k8s-build-push k8s-restart-backend k8s-restart-frontend
    @echo "Application updated successfully!"

# ==================== Local Development Commands ====================

# Start backend development server
dev-backend:
    cd backend && poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start frontend development server
dev-frontend:
    cd frontend && npm run dev

# Install backend dependencies
install-backend:
    cd backend && poetry install

# Install frontend dependencies
install-frontend:
    cd frontend && npm install

# Run backend tests
test-backend:
    cd backend && poetry run pytest

# Run frontend tests
test-frontend:
    cd frontend && npm test
