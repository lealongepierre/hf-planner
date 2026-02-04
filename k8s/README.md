# Kubernetes Manifests

This directory contains Kubernetes manifests for deploying the Hellfest Planner application.

## Directory Structure

```
k8s/
├── dev/           # Development environment manifests
│   ├── namespace.yaml
│   ├── postgres-secret.yaml
│   ├── postgres-pvc.yaml
│   ├── postgres-statefulset.yaml
│   ├── postgres-service.yaml
│   ├── backend-secret.yaml
│   ├── backend-configmap.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── backend-migration-job.yaml
│   ├── frontend-deployment.yaml
│   └── frontend-service.yaml
├── prod/          # Production environment manifests (GKE + Cloud SQL)
│   ├── namespace.yaml
│   ├── backend-secret.yaml
│   ├── backend-configmap.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── backend-migration-job.yaml
│   ├── frontend-deployment.yaml
│   └── frontend-service.yaml
└── README.md
```

## Environments

### Dev Environment (`dev/`)

Local development and testing environment using minikube.

**Configuration:**
- Namespace: `hf-planner-dev`
- PostgreSQL: 1 replica with 5Gi persistent storage
- Backend: 2 replicas
- Frontend: 2 replicas
- Services: ClusterIP for internal, LoadBalancer for frontend

### Prod Environment (`prod/`)

Production environment for GKE with Cloud SQL managed PostgreSQL.

**Configuration:**
- Namespace: `hf-planner-prod`
- PostgreSQL: Cloud SQL (external managed database)
- Backend: 3 replicas with higher resource limits
- Frontend: 3 replicas with higher resource limits
- Services: ClusterIP for backend, LoadBalancer for frontend

**Important:** No postgres-*.yaml files in prod - uses Cloud SQL instead.

## Quick Start

### Using Just Commands

The easiest way to deploy is using the provided Just commands:

```bash
# Complete setup (start minikube, build, push, deploy)
just k8s-setup

# In a separate terminal, start minikube tunnel
just k8s-tunnel
```

### Manual Deployment

1. **Update Image References**

   Before deploying, update these files with your Docker Hub username:
   - `dev/backend-deployment.yaml` (line 18)
   - `dev/backend-migration-job.yaml` (line 14)
   - `dev/frontend-deployment.yaml` (line 18)

   Replace `YOUR_DOCKERHUB_USERNAME` with your actual username.

2. **Deploy**

   ```bash
   # Deploy all resources
   just k8s-deploy

   # Or manually:
   kubectl apply -f k8s/dev/
   ```

## Common Commands

```bash
# View all resources
just k8s-status

# View pods
just k8s-pods

# View logs
just k8s-logs-backend
just k8s-logs-frontend
just k8s-logs-postgres

# Update deployment
just k8s-update

# Clean up
just k8s-undeploy
```

## Resource Descriptions

### Namespace
Creates isolated environment for the application.

### PostgreSQL
- **StatefulSet**: Ensures stable pod identity and persistent storage
- **PVC**: 5Gi persistent storage for database data
- **Service**: Headless service for StatefulSet
- **Secret**: Database credentials

### Backend
- **Deployment**: 2 replicas for high availability
- **Service**: ClusterIP for internal access
- **ConfigMap**: Non-sensitive configuration
- **Secret**: JWT secret key
- **Job**: Database migration job

### Frontend
- **Deployment**: 2 replicas for high availability
- **Service**: LoadBalancer for external access
- Uses nginx proxy to route `/api` requests to backend (no ConfigMap needed)

## Production Deployment (GKE + Cloud SQL)

### Prerequisites

1. **GKE Cluster**: Create a GKE cluster in your GCP project
2. **Cloud SQL Instance**: Set up a Cloud SQL PostgreSQL instance

### Cloud SQL Setup

1. Create a Cloud SQL PostgreSQL instance in GCP Console
2. Create a database named `hfplanner`
3. Create a user with appropriate permissions
4. Note the instance connection IP or configure Cloud SQL Proxy

### Update Secrets

Before deploying, update `k8s/prod/backend-secret.yaml` with real values:

```yaml
stringData:
  JWT_SECRET_KEY: "your-secure-random-secret-key"
  DATABASE_URL: "postgresql://USER:PASSWORD@CLOUD_SQL_IP:5432/hfplanner"
```

### Deploy to Production

```bash
# Connect to your GKE cluster
gcloud container clusters get-credentials YOUR_CLUSTER --zone YOUR_ZONE --project YOUR_PROJECT

# Deploy all resources
kubectl apply -f k8s/prod/

# Run database migrations
kubectl apply -f k8s/prod/backend-migration-job.yaml

# Check deployment status
kubectl get all -n hf-planner-prod
```

### Get External IP

```bash
# Get the LoadBalancer external IP
kubectl get svc frontend-service -n hf-planner-prod
```

## Adding New Environments

To create staging environments:

1. Copy `prod/` directory to `staging/`
2. Update namespace in all files to `hf-planner-staging`
3. Adjust replica counts and resource limits as needed
4. Update secrets with staging credentials
5. Add monitoring and logging configurations

## Security Notes

Current configuration is for development only. For production:

1. Change all default passwords in secrets
2. Use proper secret management (Sealed Secrets, External Secrets)
3. Enable network policies
4. Configure pod security standards
5. Use managed database instead of in-cluster PostgreSQL
6. Enable TLS/HTTPS with proper certificates
7. Implement RBAC policies
8. Regular security scanning of images

## Troubleshooting

See the main deployment guide: [docs/deployment/kubernetes.md](../../docs/deployment/kubernetes.md)
