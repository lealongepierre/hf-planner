# Kubernetes Deployment Guide

This guide walks through deploying the Hellfest Planner application to Kubernetes.

## Prerequisites

### Required Tools

1. **Docker** - Build and run container images
   ```bash
   docker --version
   ```

2. **kubectl** - Kubernetes command-line tool
   ```bash
   kubectl version --client
   ```

3. **minikube** - Local Kubernetes cluster (for development)
   ```bash
   minikube version
   ```

### Installation

#### macOS
```bash
brew install docker kubectl minikube
```

#### Linux
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

## Architecture Overview

The application consists of three main components:

1. **PostgreSQL StatefulSet** - Database with persistent storage
2. **Backend Deployment** - FastAPI application (2 replicas)
3. **Frontend Deployment** - React SPA served by nginx (2 replicas)

### Services

- `postgres-service` - ClusterIP (headless) for database
- `backend-service` - ClusterIP for backend API
- `frontend-service` - LoadBalancer for public access

## Deployment Steps

### 1. Start Minikube

```bash
minikube start --cpus=4 --memory=4096
```

Verify cluster is running:
```bash
kubectl cluster-info
```

### 2. Build and Push Docker Images

First, create a Docker Hub account if you don't have one: https://hub.docker.com

Login to Docker Hub:
```bash
docker login
```

Build and tag images (replace `YOUR_DOCKERHUB_USERNAME` with your actual username):
```bash
# Build backend
cd backend
docker build -t YOUR_DOCKERHUB_USERNAME/hf-planner-backend:latest .
docker push YOUR_DOCKERHUB_USERNAME/hf-planner-backend:latest

# Build frontend
cd ../frontend
docker build -t YOUR_DOCKERHUB_USERNAME/hf-planner-frontend:latest .
docker push YOUR_DOCKERHUB_USERNAME/hf-planner-frontend:latest
```

### 3. Update Kubernetes Manifests

Before deploying, update the image references in these files:
- `k8s/dev/backend-deployment.yaml` - Line 18
- `k8s/dev/backend-migration-job.yaml` - Line 14
- `k8s/dev/frontend-deployment.yaml` - Line 18

Replace `YOUR_DOCKERHUB_USERNAME` with your Docker Hub username.

### 4. Deploy to Kubernetes

Deploy in order (dependencies first):

```bash
# Create namespace
kubectl apply -f k8s/dev/namespace.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/dev/postgres-secret.yaml
kubectl apply -f k8s/dev/postgres-pvc.yaml
kubectl apply -f k8s/dev/postgres-statefulset.yaml
kubectl apply -f k8s/dev/postgres-service.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n hf-planner-dev --timeout=120s

# Deploy Backend
kubectl apply -f k8s/dev/backend-secret.yaml
kubectl apply -f k8s/dev/backend-configmap.yaml
kubectl apply -f k8s/dev/backend-deployment.yaml
kubectl apply -f k8s/dev/backend-service.yaml

# Run database migration
kubectl apply -f k8s/dev/backend-migration-job.yaml

# Wait for migration to complete
kubectl wait --for=condition=complete job/backend-migration -n hf-planner-dev --timeout=120s

# Deploy Frontend
kubectl apply -f k8s/dev/frontend-configmap.yaml
kubectl apply -f k8s/dev/frontend-deployment.yaml
kubectl apply -f k8s/dev/frontend-service.yaml
```

### 5. Seed the Database (Optional)

If you want to populate the database with test data:

```bash
# Get a backend pod name
BACKEND_POD=$(kubectl get pods -n hf-planner-dev -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Run seed command
kubectl exec -n hf-planner-dev $BACKEND_POD -- poetry run python -m app.utils.seed
```

### 6. Access the Application

For minikube, you need to run `minikube tunnel` in a separate terminal to access LoadBalancer services:

```bash
# In a new terminal
minikube tunnel
```

Get the frontend service URL:
```bash
kubectl get service frontend-service -n hf-planner-dev
```

The application should be accessible at `http://localhost` (or the EXTERNAL-IP shown).

## Verification

### Check Pod Status

```bash
kubectl get pods -n hf-planner-dev
```

All pods should show `Running` status.

### Check Logs

```bash
# Backend logs
kubectl logs -n hf-planner-dev -l app=backend --tail=50

# Frontend logs
kubectl logs -n hf-planner-dev -l app=frontend --tail=50

# PostgreSQL logs
kubectl logs -n hf-planner-dev -l app=postgres --tail=50

# Migration job logs
kubectl logs -n hf-planner-dev job/backend-migration
```

### Test Health Endpoints

Port-forward commands run continuously and block the terminal. You need separate terminals for the port-forward and curl commands.

**Terminal 1** - Start backend port-forward:
```bash
kubectl port-forward -n hf-planner-dev service/backend-service 8000:8000
# This keeps running... don't close this terminal
```

**Terminal 2** - Test backend health:
```bash
curl http://localhost:8000/health
```

**Terminal 3** - Start frontend port-forward:
```bash
kubectl port-forward -n hf-planner-dev service/frontend-service 8080:80
# This keeps running... don't close this terminal
```

**Terminal 4** - Test frontend health:
```bash
curl http://localhost:8080/health
```

When done testing, press `Ctrl+C` in terminals 1 and 3 to stop the port-forwards.

## Common Operations

### Update Application

After making changes and building new images:

```bash
# Push new images
docker push YOUR_DOCKERHUB_USERNAME/hf-planner-backend:latest
docker push YOUR_DOCKERHUB_USERNAME/hf-planner-frontend:latest

# Force pod restart to pull new images
kubectl rollout restart deployment/backend -n hf-planner-dev
kubectl rollout restart deployment/frontend -n hf-planner-dev

# Watch rollout status
kubectl rollout status deployment/backend -n hf-planner-dev
kubectl rollout status deployment/frontend -n hf-planner-dev
```

### Scale Deployments

```bash
# Scale backend
kubectl scale deployment backend -n hf-planner-dev --replicas=3

# Scale frontend
kubectl scale deployment frontend -n hf-planner-dev --replicas=3
```

### Run Database Migration

```bash
# Delete old migration job
kubectl delete job backend-migration -n hf-planner-dev

# Create new migration job
kubectl apply -f k8s/dev/backend-migration-job.yaml
```

### Access Database

**Option 1** - Connect directly via kubectl (recommended, no installation needed):
```bash
kubectl exec -it -n hf-planner-dev postgres-0 -- psql -U hfplanner -d hfplanner
```

**Option 2** - Use port-forward (requires psql installed locally):

**Terminal 1** - Start port-forward:
```bash
kubectl port-forward -n hf-planner-dev statefulset/postgres 5432:5432
# This keeps running... don't close this terminal
```

**Terminal 2** - Connect with psql:
```bash
psql -h localhost -U hfplanner -d hfplanner
# Password: hfplanner
```

Press `Ctrl+C` in terminal 1 when done to stop the port-forward.

### Clean Up

To delete everything:

```bash
kubectl delete namespace hf-planner-dev
```

To stop minikube:

```bash
minikube stop
```

To delete minikube cluster:

```bash
minikube delete
```

## Troubleshooting

### Pods Not Starting

Check pod events:
```bash
kubectl describe pod <pod-name> -n hf-planner-dev
```

### Image Pull Errors

Verify image names and ensure they're pushed to Docker Hub:
```bash
docker images | grep hf-planner
```

### Database Connection Issues

Verify PostgreSQL is running and secrets are correct:
```bash
kubectl get pods -n hf-planner-dev -l app=postgres
kubectl get secrets -n hf-planner-dev postgres-secret -o yaml
```

### Migration Job Failed

Check migration job logs:
```bash
kubectl logs -n hf-planner-dev job/backend-migration
```

Delete and recreate the job:
```bash
kubectl delete job backend-migration -n hf-planner-dev
kubectl apply -f k8s/dev/backend-migration-job.yaml
```

## Next Steps

### Production Deployment

For production deployment:

1. Use managed Kubernetes (GKE, EKS, AKS)
2. Use managed PostgreSQL (Cloud SQL, RDS, Azure Database)
3. Set up proper secrets management (Sealed Secrets, External Secrets)
4. Configure Ingress with TLS certificates
5. Set up monitoring and logging
6. Configure backup and disaster recovery
7. Implement CI/CD pipelines

### Security Improvements

1. Change default passwords in secrets
2. Use HTTPS/TLS for all services
3. Implement network policies
4. Enable pod security standards
5. Scan images for vulnerabilities
6. Use non-root containers (already implemented)
7. Implement RBAC policies
