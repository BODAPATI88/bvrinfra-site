# bvrinfra Metrics Integration
Live Kubernetes + Prometheus telemetry for bvrinfra.in

## Architecture

```
Public Internet
      │
      ▼
Cloudflare Tunnel
      │
      ▼
Traefik Ingress (K3s)
      │
      ├─── /          ──► nginx (static portfolio)
      │
      └─── /metrics/  ──► metrics-api (Flask, ClusterIP)
                               │
                               ▼
                        Prometheus (internal)
                               │
                               ▼
                        kube-state-metrics + node-exporter
```

**Security posture:**
- Prometheus is never exposed externally
- metrics-api runs as non-root, read-only filesystem
- Only sanitised high-level metrics are returned
- CORS locked to `https://bvrinfra.in`
- Rate-limited at Traefik (60 req/min)
- No pod IPs, node hostnames, versions, or topology exposed

---

## Folder Structure

```
bvrinfra-metrics/
├── metrics-api/
│   ├── app.py              # Flask metrics API
│   ├── requirements.txt
│   └── Dockerfile
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml      # Environment variables
│   ├── deployment.yaml
│   ├── service.yaml        # ClusterIP — internal only
│   ├── ingress.yaml        # Traefik IngressRoute + middlewares
│   └── rbac.yaml           # ServiceAccount + ServiceMonitor
├── argocd/
│   └── application.yaml    # ArgoCD Application CR
├── frontend/
│   └── index.html          # Enhanced portfolio (drop-in replacement)
└── README.md
```

---

## Deployment Steps

### 1. Build & Push the Docker Image

```bash
cd metrics-api/

# Replace with your registry
docker build -t ghcr.io/bvrinfra/metrics-api:latest .
docker push ghcr.io/bvrinfra/metrics-api:latest
```

If using a private registry, create an image pull secret:
```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username=<user> \
  --docker-password=<token> \
  -n bvrinfra
```
Then add `imagePullSecrets` to `deployment.yaml`.

---

### 2. Verify Prometheus Service Name

```bash
kubectl get svc -n monitoring
```

Update `PROMETHEUS_URL` in `k8s/configmap.yaml` to match.
Common values:
- `http://prometheus-operated.monitoring.svc.cluster.local:9090`  (kube-prometheus-stack)
- `http://prometheus.monitoring.svc.cluster.local:9090`           (plain Prometheus)

---

### 3. Apply Manifests Manually (or via ArgoCD)

**Manual:**
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

**Via ArgoCD:**
1. Push this repo to your `infra-homelab` Git repo under `apps/metrics-api/`
2. Edit `argocd/application.yaml` — set `repoURL` to your repo
3. Apply the Application:
```bash
kubectl apply -f argocd/application.yaml
```

---

### 4. Verify the API is Running

```bash
# Check pod status
kubectl get pods -n bvrinfra

# Check logs
kubectl logs -n bvrinfra deploy/metrics-api -f

# Test internally from a debug pod
kubectl run tmp --rm -it --image=curlimages/curl --restart=Never -- \
  curl http://metrics-api.bvrinfra.svc.cluster.local/health

# Test via public URL
curl https://bvrinfra.in/metrics/api/metrics | jq .
```

---

### 5. Deploy the Frontend

Replace your existing `index.html` in the nginx container:

```bash
# If using a ConfigMap for static files:
kubectl create configmap bvrinfra-frontend \
  --from-file=index.html=frontend/index.html \
  -n bvrinfra --dry-run=client -o yaml | kubectl apply -f -

# Or rebuild your nginx Docker image with the new index.html
docker build -t ghcr.io/bvrinfra/portfolio:latest ./frontend
docker push ghcr.io/bvrinfra/portfolio:latest
kubectl rollout restart deploy/portfolio -n bvrinfra
```

---

## Prometheus Query Reference

| Metric | PromQL |
|--------|--------|
| Running pods | `count(kube_pod_info{phase!="Succeeded",phase!="Failed"})` |
| Node count | `count(kube_node_info)` |
| CPU utilization % | `100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))` |
| Memory utilization % | `100 * (1 - sum(node_memory_MemAvailable_bytes) / sum(node_memory_MemTotal_bytes))` |
| Cluster uptime (hours) | `(time() - min(kube_node_created)) / 3600` |
| Active namespaces | `count(kube_namespace_status_phase{phase="Active"})` |
| Available deployments | `count(kube_deployment_status_replicas_available > 0)` |
| Traefik RPS | `sum(rate(traefik_entrypoint_requests_total[2m]))` |
| Nodes ready fraction | `sum(kube_node_status_condition{condition="Ready",status="true"}) / count(kube_node_info)` |
| ArgoCD synced apps | `count(argocd_app_info{sync_status="Synced"})` |
| ArgoCD healthy apps | `count(argocd_app_info{health_status="Healthy"})` |

---

## Adjusting the Prometheus URL / Namespace

If your kube-prometheus-stack is in a different namespace:
```bash
kubectl get svc -A | grep prometheus
```
Update `PROMETHEUS_URL` in `k8s/configmap.yaml` accordingly.

---

## Troubleshooting

**Pod stuck in `Pending`**
```bash
kubectl describe pod -n bvrinfra -l app=metrics-api
```
Check: image pull errors, resource limits, node affinity.

**`/api/metrics` returns `503`**
- The Flask app cannot reach Prometheus.
- Verify `PROMETHEUS_URL` in the ConfigMap.
- Check network policies: does `bvrinfra` namespace have egress to `monitoring`?

**CORS errors in browser console**
- Confirm `ALLOWED_ORIGIN` in ConfigMap exactly matches your site's origin (including `https://`).
- No trailing slash.

**ArgoCD shows `OutOfSync` on image**
- Expected — image tag is managed by CI. The `ignoreDifferences` block in `application.yaml` suppresses this.

**Traefik 404 on `/metrics/api/metrics`**
- Confirm the `IngressRoute` is in the same namespace as the service (`bvrinfra`).
- Check Traefik CRD version: if using Traefik v3, the API group may be `traefik.io/v1alpha1` instead of `traefik.containo.us/v1alpha1`.

**Frontend shows "metrics temporarily unavailable"**
- Open DevTools → Network → check the `/metrics/api/metrics` request.
- Look for CORS headers, 5xx responses, or DNS failures.
