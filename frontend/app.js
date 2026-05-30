/* ============================================================
   BVRInfra — app.js
   Fetches live cluster metrics every 15 seconds.
   No frameworks. No fake data.
   ============================================================ */

(function () {
  'use strict';

  const API_URL      = 'https://api.bvrinfra.in/api/v1/cluster-health';
  const REFRESH_MS   = 15000;

  /* ── DOM refs ──────────────────────────────────────────────── */
  const els = {
    navDot:      document.getElementById('nav-dot'),
    navStatus:   document.getElementById('nav-status-text'),
    errorBanner: document.getElementById('api-error-banner'),
    errorMsg:    document.getElementById('api-error-msg'),

    statusCard:  document.getElementById('metric-status-card'),
    statusVal:   document.getElementById('metric-status'),
    nodesVal:    document.getElementById('metric-nodes'),
    podsVal:     document.getElementById('metric-pods'),
    cpuVal:      document.getElementById('metric-cpu'),
    memVal:      document.getElementById('metric-memory'),

    lastRefresh: document.getElementById('last-refresh'),
    barFill:     document.getElementById('refresh-bar-fill'),
  };

  /* ── State ─────────────────────────────────────────────────── */
  let timerInterval  = null;
  let barInterval    = null;
  let elapsed        = 0;

  /* ── Helpers ───────────────────────────────────────────────── */
  function parseMetricValue(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const item = arr[0];
    if (item && Array.isArray(item.value) && item.value.length >= 2) {
      const v = parseFloat(item.value[1]);
      return isNaN(v) ? null : v;
    }
    return null;
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function setLoading() {
    ['nodesVal', 'podsVal', 'cpuVal', 'memVal'].forEach(k => {
      els[k].textContent = '—';
      els[k].className   = 'metric-val loading';
    });
    els.statusVal.textContent = 'FETCHING';
    els.statusCard.className  = 'metric-card status-card';
  }

  function setError(message) {
    els.navDot.className       = 'pulse-dot error';
    els.navStatus.textContent  = 'API UNREACHABLE';
    els.errorBanner.classList.add('visible');
    els.errorMsg.textContent   = message || 'Unable to reach metrics API.';

    els.statusVal.textContent = 'UNREACHABLE';
    els.statusCard.className  = 'metric-card status-card status-error';

    ['nodesVal', 'podsVal', 'cpuVal', 'memVal'].forEach(k => {
      els[k].textContent = 'N/A';
      els[k].className   = 'metric-val error-val';
    });
  }

  function applyMetrics(data) {
    els.errorBanner.classList.remove('visible');

    /* Status */
    const status = (data.status || '').toLowerCase();
    els.statusVal.textContent = (data.status || 'UNKNOWN').toUpperCase();
    if (status === 'healthy') {
      els.statusCard.className   = 'metric-card status-card status-healthy';
      els.navDot.className       = 'pulse-dot';
      els.navStatus.textContent  = 'CLUSTER HEALTHY';
    } else {
      els.statusCard.className   = 'metric-card status-card status-error';
      els.navDot.className       = 'pulse-dot warn';
      els.navStatus.textContent  = 'CLUSTER DEGRADED';
    }

    /* Nodes */
    const nodes = parseMetricValue(data.nodes);
    els.nodesVal.textContent = nodes !== null ? Math.round(nodes) : 'N/A';
    els.nodesVal.className   = 'metric-val' + (nodes === null ? ' error-val' : '');

    /* Pods */
    const pods = parseMetricValue(data.pods);
    els.podsVal.textContent = pods !== null ? Math.round(pods) : 'N/A';
    els.podsVal.className   = 'metric-val' + (pods === null ? ' error-val' : '');

    /* CPU */
    const cpu = parseMetricValue(data.cpu);
    els.cpuVal.textContent = cpu !== null ? cpu.toFixed(1) : 'N/A';
    els.cpuVal.className   = 'metric-val' + (cpu === null ? ' error-val' : '');

    /* Memory */
    const mem = parseMetricValue(data.memory);
    els.memVal.textContent = mem !== null ? mem.toFixed(1) : 'N/A';
    els.memVal.className   = 'metric-val' + (mem === null ? ' error-val' : '');

    /* Timestamp */
    els.lastRefresh.textContent = 'Last updated: ' + formatTime(new Date());
  }

  /* ── Fetch ─────────────────────────────────────────────────── */
  async function fetchMetrics() {
    try {
      const res = await fetch(API_URL, {
        method:  'GET',
        headers: { 'Accept': 'application/json' },
        signal:  AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        throw new Error('HTTP ' + res.status + ' ' + res.statusText);
      }

      const data = await res.json();
      applyMetrics(data);

    } catch (err) {
      let msg = 'Network error.';
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        msg = 'Request timed out after 8 seconds.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    }
  }

  /* ── Refresh Progress Bar ───────────────────────────────────── */
  function startRefreshBar() {
    elapsed = 0;
    updateBar();
    if (barInterval) clearInterval(barInterval);
    barInterval = setInterval(() => {
      elapsed += 1000;
      updateBar();
    }, 1000);
  }

  function updateBar() {
    const pct = Math.min((elapsed / REFRESH_MS) * 100, 100);
    els.barFill.style.width = pct + '%';
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    setLoading();
    fetchMetrics();
    startRefreshBar();

    timerInterval = setInterval(() => {
      fetchMetrics();
      startRefreshBar();
    }, REFRESH_MS);
  }

  /* Start when DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
