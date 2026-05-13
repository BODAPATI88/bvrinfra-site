# bvrinfra.in — Portfolio Site

Platform engineering portfolio for Ravi Kishore.  
Deployed via Kubernetes · ArgoCD · Traefik · Cloudflare Tunnel.

## Stack

- React + Vite (single-page app)
- Nginx serving static build
- Containerised with Docker
- Deployed on K3s via ArgoCD GitOps
- Public ingress via Cloudflare Tunnel → Traefik

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Docker

```bash
# Build
docker build -t bvrinfra-portfolio:latest .

# Run locally
docker run -p 8080:80 bvrinfra-portfolio:latest

# Push to registry
docker tag bvrinfra-portfolio:latest ghcr.io/bodapati88/bvrinfra-portfolio:latest
docker push ghcr.io/bodapati88/bvrinfra-portfolio:latest
```

## Kubernetes Deployment

### Manual

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### Via ArgoCD (recommended)

1. Copy `k8s/` contents to `apps/portfolio/` in your infra-homelab repo
2. Apply the ArgoCD Application:

```bash
kubectl apply -f k8s/argocd-app.yaml
```

3. ArgoCD will auto-sync and deploy. Verify:

```bash
kubectl get applications -n argocd
kubectl get pods -l app=bvrinfra-portfolio
```

## Cloudflare Tunnel Route

Add to your k8s-homelab tunnel public hostnames:

| Subdomain | Domain     | Service                          |
|-----------|------------|----------------------------------|
| (root)    | bvrinfra.in | http://bvrinfra-portfolio.default:80 |
| www       | bvrinfra.in | http://bvrinfra-portfolio.default:80 |

## Verify deployment

```bash
# Pods running
kubectl get pods -l app=bvrinfra-portfolio

# Service reachable
kubectl port-forward svc/bvrinfra-portfolio 8080:80

# End-to-end
curl -I https://bvrinfra.in
```

## Project structure

```
bvrinfra-portfolio/
├── src/
│   ├── components/     # React components per section
│   └── assets/         # Static assets
├── public/
├── k8s/
│   ├── deployment.yaml  # Deployment + Service
│   ├── ingress.yaml     # Traefik Ingress
│   └── argocd-app.yaml  # ArgoCD Application CRD
├── Dockerfile
├── nginx.conf
└── README.md
```
