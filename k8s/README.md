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
│   ├── frontend-configmap.yaml
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
- **ConfigMap**: API URL configuration

## Adding New Environments

To create staging or production environments:

1. Copy `dev/` directory to `staging/` or `prod/`
2. Update namespace in all files
3. Adjust replica counts and resource limits
4. Update secrets with production credentials
5. Configure Ingress instead of LoadBalancer
6. Add monitoring and logging configurations

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
