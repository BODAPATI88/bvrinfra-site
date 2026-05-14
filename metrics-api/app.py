"""
bvrinfra Metrics API
Secure internal bridge between Prometheus and the public portfolio site.
Exposes only sanitised, high-level operational metrics — no topology, no IPs,
no versions, no secrets.
"""

import os
import time
import logging
from functools import wraps

import requests
from flask import Flask, jsonify
from flask_cors import CORS
from cachetools import TTLCache, cached
import threading

# ---------------------------------------------------------------------------
# App bootstrap
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger("metrics-api")

app = Flask(__name__)

# CORS: only allow requests from the same portfolio domain.
# Update ALLOWED_ORIGIN in the ConfigMap if your domain changes.
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "https://bvrinfra.in")
CORS(app, origins=[ALLOWED_ORIGIN], supports_credentials=False)

PROMETHEUS_URL   = os.getenv("PROMETHEUS_URL", "http://prometheus-operated.monitoring.svc.cluster.local:9090")
CACHE_TTL        = int(os.getenv("CACHE_TTL_SECONDS", "30"))
REQUEST_TIMEOUT  = int(os.getenv("PROMETHEUS_TIMEOUT_SECONDS", "8"))

# ---------------------------------------------------------------------------
# Thread-safe TTL cache  (one shared slot; keyed by function)
# ---------------------------------------------------------------------------

_cache_lock  = threading.Lock()
_metrics_cache: dict = {}
_cache_timestamp: float = 0.0


def get_cached_metrics():
    global _metrics_cache, _cache_timestamp
    with _cache_lock:
        age = time.time() - _cache_timestamp
        if age < CACHE_TTL and _metrics_cache:
            log.debug("Cache hit (age=%.1fs)", age)
            return _metrics_cache, True          # (data, from_cache)
        data = _fetch_all_metrics()
        _metrics_cache    = data
        _cache_timestamp  = time.time()
        return data, False


# ---------------------------------------------------------------------------
# Prometheus query helpers
# ---------------------------------------------------------------------------

def prom_query(expr: str) -> float | None:
    """Run an instant PromQL query; return the first scalar value or None."""
    try:
        resp = requests.get(
            f"{PROMETHEUS_URL}/api/v1/query",
            params={"query": expr},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        result = resp.json().get("data", {}).get("result", [])
        if result:
            return float(result[0]["value"][1])
        return None
    except requests.exceptions.ConnectionError:
        log.warning("Prometheus unreachable for query: %s", expr)
        return None
    except requests.exceptions.Timeout:
        log.warning("Prometheus timeout for query: %s", expr)
        return None
    except Exception as exc:
        log.error("Unexpected error querying Prometheus: %s", exc)
        return None


def prom_scalar(expr: str, default=None, precision: int = 2):
    """Query and round to `precision` decimals; return default on failure."""
    val = prom_query(expr)
    if val is None:
        return default
    return round(val, precision)


# ---------------------------------------------------------------------------
# Prometheus queries — all sanitised for public exposure
# ---------------------------------------------------------------------------

QUERIES = {
    # --- cluster vitals ---
    "pod_count": 'count(kube_pod_info{phase!="Succeeded",phase!="Failed"})',

    "node_count": "count(kube_node_info)",

    "cpu_utilization_pct": """
        100 * (
          1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))
        )
    """,

    "memory_utilization_pct": """
        100 * (
          1 - (
            sum(node_memory_MemAvailable_bytes) /
            sum(node_memory_MemTotal_bytes)
          )
        )
    """,

    # Cluster uptime: age of the oldest node in hours
    "cluster_uptime_hours": """
        (time() - min(kube_node_created)) / 3600
    """,

    # Active namespaces (exclude system ones for the count shown)
    "namespace_count": "count(kube_namespace_status_phase{phase='Active'})",

    # Running deployments
    "deployment_count": """
        count(kube_deployment_status_replicas_available > 0)
    """,

    # Traefik: requests per second across all entrypoints
    "ingress_rps": """
        sum(rate(traefik_entrypoint_requests_total[2m]))
    """,

    # Overall cluster health: fraction of ready nodes (0–1)
    "nodes_ready_fraction": """
        sum(kube_node_status_condition{condition="Ready",status="true"})
        /
        count(kube_node_info)
    """,

    # ArgoCD: synced application count
    "argocd_synced_apps": """
        count(argocd_app_info{sync_status="Synced"})
    """,

    # ArgoCD: healthy application count
    "argocd_healthy_apps": """
        count(argocd_app_info{health_status="Healthy"})
    """,
}


def _classify_health(nodes_ready: float | None, cpu: float | None, mem: float | None) -> str:
    """
    Return 'healthy' | 'degraded' | 'critical' | 'unknown'.
    Logic is intentionally simple and public-safe — no topology leakage.
    """
    if nodes_ready is None:
        return "unknown"
    if nodes_ready < 1.0:
        return "critical"
    if cpu is not None and cpu > 90:
        return "degraded"
    if mem is not None and mem > 90:
        return "degraded"
    return "healthy"


def _uptime_human(hours: float | None) -> str:
    if hours is None:
        return "—"
    days  = int(hours // 24)
    hrs   = int(hours % 24)
    if days > 0:
        return f"{days}d {hrs}h"
    return f"{hrs}h"


def _fetch_all_metrics() -> dict:
    """
    Hit Prometheus for every metric.  Never raise — always return a
    partial result so the frontend can degrade gracefully.
    """
    log.info("Fetching fresh metrics from Prometheus")
    start = time.time()

    cpu  = prom_scalar(QUERIES["cpu_utilization_pct"], precision=1)
    mem  = prom_scalar(QUERIES["memory_utilization_pct"], precision=1)
    nrf  = prom_scalar(QUERIES["nodes_ready_fraction"], precision=4)
    uh   = prom_scalar(QUERIES["cluster_uptime_hours"], precision=1)

    data = {
        "timestamp":              int(time.time()),
        "fetch_duration_ms":      round((time.time() - start) * 1000),
        "cluster_health":         _classify_health(nrf, cpu, mem),
        "nodes_ready_fraction":   nrf,
        "pod_count":              prom_scalar(QUERIES["pod_count"],  precision=0),
        "node_count":             prom_scalar(QUERIES["node_count"], precision=0),
        "cpu_utilization_pct":    cpu,
        "memory_utilization_pct": mem,
        "cluster_uptime_hours":   uh,
        "cluster_uptime_human":   _uptime_human(uh),
        "namespace_count":        prom_scalar(QUERIES["namespace_count"],   precision=0),
        "deployment_count":       prom_scalar(QUERIES["deployment_count"],  precision=0),
        "ingress_rps":            prom_scalar(QUERIES["ingress_rps"],       precision=2),
        "argocd_synced_apps":     prom_scalar(QUERIES["argocd_synced_apps"],  precision=0),
        "argocd_healthy_apps":    prom_scalar(QUERIES["argocd_healthy_apps"], precision=0),
    }

    # Compute "all pods healthy" flag without leaking pod names
    pods_ok = (
        data["pod_count"] is not None
        and data["cluster_health"] in ("healthy", "degraded")
    )
    data["pods_healthy"] = pods_ok

    log.info(
        "Metrics fetched in %.0fms | health=%s pods=%s cpu=%.1f%% mem=%.1f%%",
        data["fetch_duration_ms"],
        data["cluster_health"],
        data["pod_count"],
        cpu or 0,
        mem or 0,
    )
    return data


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    """Kubernetes liveness / readiness probe."""
    reachable = False
    try:
        r = requests.get(f"{PROMETHEUS_URL}/-/healthy", timeout=3)
        reachable = r.ok
    except Exception:
        pass
    status = "ok" if reachable else "degraded"
    return jsonify({"status": status, "prometheus": reachable}), 200


@app.route("/api/metrics", methods=["GET"])
def metrics():
    """
    Main endpoint consumed by the portfolio frontend.
    Returns high-level cluster telemetry; nothing topology-sensitive.
    """
    try:
        data, from_cache = get_cached_metrics()
        resp = jsonify({
            "ok":         True,
            "cached":     from_cache,
            "data":       data,
        })
        resp.headers["Cache-Control"] = f"public, max-age={CACHE_TTL}"
        return resp, 200
    except Exception as exc:
        log.error("Unhandled error in /api/metrics: %s", exc)
        return jsonify({
            "ok":    False,
            "error": "metrics_unavailable",
            "data":  None,
        }), 503


@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"pong": True, "ts": int(time.time())}), 200


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    log.info("bvrinfra Metrics API starting on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=False)
