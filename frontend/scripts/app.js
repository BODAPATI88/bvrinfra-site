/* ═══════════════════════════════════════════════════════
   KUBENOVA — app.js
   Platform Engineering Console · Vanilla JS
═══════════════════════════════════════════════════════ */

'use strict';

// ░ CONSTANTS & STATE ░
const CSS = {
  blue:   '#00c8ff',
  cyan:   '#00ffe5',
  purple: '#a855f7',
  green:  '#00ff88',
  yellow: '#ffd700',
  red:    '#ff3b5c',
  dim:    'rgba(0,200,255,0.12)',
  grid:   'rgba(0,200,255,0.06)',
  gridBright: 'rgba(0,200,255,0.15)',
};

const NAMESPACES = ['prod', 'staging', 'monitoring', 'kube-system', 'ingress-nginx', 'cert-manager'];
const SERVICES   = ['api-gateway', 'auth-service', 'user-service', 'data-pipeline', 'ml-inference', 'frontend', 'websocket-srv', 'scheduler'];
const IMAGES     = ['nginx:1.25.4', 'node:20-alpine', 'python:3.12-slim', 'golang:1.22-alpine', 'redis:7.2', 'postgres:16'];

/* ═══════════════════════════════════════════════
   1. GRID CANVAS BACKGROUND
═══════════════════════════════════════════════ */
(function initGrid() {
  const canvas = document.getElementById('gridCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, frame = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function drawGrid() {
    ctx.clearRect(0, 0, W, H);

    const CELL = 48;
    const t = frame * 0.003;

    // Subtle vertical scan gradient
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0,   'rgba(0,200,255,0.0)');
    grd.addColorStop(0.4, 'rgba(0,200,255,0.03)');
    grd.addColorStop(1,   'rgba(0,200,255,0.0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = CSS.grid;
    ctx.lineWidth = 0.5;

    const cols = Math.ceil(W / CELL) + 2;
    const rows = Math.ceil(H / CELL) + 2;

    ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
      const x = c * CELL;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let r = 0; r <= rows; r++) {
      const y = r * CELL;
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    // Glowing intersection dots
    ctx.fillStyle = CSS.gridBright;
    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        const brightness = 0.3 + 0.7 * Math.abs(
          Math.sin(c * 0.3 + t) * Math.cos(r * 0.25 + t * 0.7)
        );
        if (brightness > 0.7) {
          ctx.globalAlpha = brightness * 0.6;
          ctx.beginPath();
          ctx.arc(c * CELL, r * CELL, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Horizon glow at bottom
    const horizGrd = ctx.createLinearGradient(0, H * 0.7, 0, H);
    horizGrd.addColorStop(0, 'rgba(0,200,255,0)');
    horizGrd.addColorStop(1, 'rgba(0,200,255,0.04)');
    ctx.fillStyle = horizGrd;
    ctx.fillRect(0, H * 0.7, W, H * 0.3);
  }

  function loop() {
    frame++;
    drawGrid();
    requestAnimationFrame(loop);
  }

  resize();
  loop();
  window.addEventListener('resize', resize);
})();


/* ═══════════════════════════════════════════════
   2. COUNTER ANIMATIONS
═══════════════════════════════════════════════ */
function animateCounter(el, target, duration = 1200) {
  const start = performance.now();
  const isDecimal = target % 1 !== 0;

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    const val = target * ease;
    el.textContent = isDecimal ? val.toFixed(2) : Math.floor(val);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = isDecimal ? target.toFixed(2) : target;
  }
  requestAnimationFrame(tick);
}

document.querySelectorAll('.hs-num[data-target]').forEach(el => {
  const target = parseInt(el.dataset.target, 10);
  setTimeout(() => animateCounter(el, target, 1400), 400);
});


/* ═══════════════════════════════════════════════
   3. MINI SPARKLINE CHARTS (Canvas)
═══════════════════════════════════════════════ */
function generateSeries(points, base, variance, trend = 0) {
  const data = [];
  let val = base;
  for (let i = 0; i < points; i++) {
    val = Math.max(2, Math.min(98,
      val + (Math.random() - 0.5) * variance + trend
    ));
    data.push(val);
  }
  return data;
}

function drawSparkline(canvasId, data, color, filled = true) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;

  ctx.clearRect(0, 0, W, H);

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (W - pad * 2) + pad,
    y: H - pad - ((v - min) / range) * (H - pad * 2)
  }));

  // Filled area
  if (filled) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color.replace(')', ',0.35)').replace('rgb', 'rgba'));
    grad.addColorStop(1, color.replace(')', ',0.0)').replace('rgb', 'rgba'));
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Line
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Dot at last point
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
  ctx.strokeStyle = color.replace(')', ',0.3)').replace('rgb', 'rgba');
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Draw all sparklines with slight delays for stagger
const charts = [
  { id: 'cpuChart',     color: CSS.blue,   base: 67, var: 8,  trend:  0.1 },
  { id: 'memChart',     color: CSS.cyan,   base: 43, var: 5,  trend: -0.05 },
  { id: 'netChart',     color: CSS.purple, base: 60, var: 15, trend:  0.2 },
  { id: 'restartChart', color: CSS.yellow, base: 20, var: 12, trend: -0.1 },
  { id: 'errorChart',   color: CSS.red,    base: 10, var: 5,  trend: -0.08 },
];

charts.forEach((c, i) => {
  setTimeout(() => {
    const data = generateSeries(32, c.base, c.var, c.trend);
    drawSparkline(c.id, data, c.color);
  }, 600 + i * 80);
});

// Wide latency chart
setTimeout(() => {
  const data = generateSeries(48, 45, 20, 0.05);
  const canvas = document.getElementById('latencyChart');
  if (canvas) {
    const W = canvas.width;
    const H = canvas.height;
    const ctx = canvas.getContext('2d');
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 4;

    ctx.clearRect(0, 0, W, H);

    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * (W - pad * 2) + pad,
      y: H - pad - ((v - min) / range) * (H - pad * 2)
    }));

    // Gradient fill
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,200,255,0.3)');
    grad.addColorStop(1, 'rgba(0,200,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = CSS.blue;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}, 700);

// Throughput chart
setTimeout(() => {
  const canvas = document.getElementById('throughputChart');
  if (!canvas) return;
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  const services = [
    { name: 'api-gateway',   data: generateSeries(60, 800, 120, 2),  color: CSS.blue },
    { name: 'auth-service',  data: generateSeries(60, 400, 80,  1),  color: CSS.cyan },
    { name: 'data-pipeline', data: generateSeries(60, 600, 150, -1), color: CSS.purple },
    { name: 'frontend',      data: generateSeries(60, 300, 60,  0),  color: CSS.green },
  ];

  ctx.clearRect(0, 0, W, H);

  const globalMin = 0;
  const globalMax = 1200;
  const range = globalMax - globalMin;
  const pad = 4;

  services.forEach(svc => {
    const pts = svc.data.map((v, i) => ({
      x: (i / (svc.data.length - 1)) * (W - pad * 2) + pad,
      y: H - pad - ((v - globalMin) / range) * (H - pad * 2)
    }));

    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = svc.color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.85;
    ctx.lineJoin = 'round';
    ctx.stroke();
  });

  ctx.globalAlpha = 1;

  // Legend
  const legendY = H - 2;
  services.forEach((svc, i) => {
    ctx.fillStyle = svc.color;
    ctx.fillRect(10 + i * 130, legendY - 8, 8, 8);
    ctx.fillStyle = 'rgba(120,155,191,0.8)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(svc.name, 22 + i * 130, legendY);
  });
}, 800);


/* ═══════════════════════════════════════════════
   4. LIVE METRIC TICKING
═══════════════════════════════════════════════ */
function tickMetric(id, base, min, max, decimals = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  setInterval(() => {
    const jitter = (Math.random() - 0.5) * (max - min) * 0.04;
    const current = parseFloat(el.textContent) + jitter;
    const clamped = Math.max(min, Math.min(max, current));
    el.textContent = decimals ? clamped.toFixed(decimals) : Math.round(clamped);
  }, 2500);
}

tickMetric('cpuVal', 67, 45, 82);
tickMetric('memVal', 43, 30, 58);
tickMetric('netVal', 1.2, 0.8, 1.8, 1);
tickMetric('restartVal', 3, 1, 8);


/* ═══════════════════════════════════════════════
   5. OPERATIONAL STATUS LIST
═══════════════════════════════════════════════ */
const statusItems = [
  { name: 'API Gateway',       status: 'ok',      uptime: '99.99%', latency: '12ms' },
  { name: 'Auth Service',      status: 'ok',      uptime: '99.97%', latency: '8ms' },
  { name: 'Data Pipeline',     status: 'ok',      uptime: '99.91%', latency: '45ms' },
  { name: 'ML Inference',      status: 'ok',      uptime: '99.84%', latency: '182ms' },
  { name: 'Prometheus',        status: 'ok',      uptime: '100%',   latency: '5ms' },
  { name: 'Grafana',           status: 'ok',      uptime: '100%',   latency: '7ms' },
  { name: 'Loki Log Agg.',     status: 'warn',    uptime: '99.50%', latency: '23ms' },
  { name: 'Cert-Manager',      status: 'ok',      uptime: '100%',   latency: '3ms' },
  { name: 'External DNS',      status: 'ok',      uptime: '99.98%', latency: '18ms' },
];

(function renderStatusList() {
  const container = document.getElementById('statusList');
  if (!container) return;

  statusItems.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'status-item';
    el.style.animationDelay = `${i * 60}ms`;
    el.innerHTML = `
      <div class="si-status ${item.status}"></div>
      <div class="si-name">${item.name}</div>
      <div class="si-uptime">${item.uptime}</div>
      <div class="si-latency">${item.latency}</div>
    `;
    container.appendChild(el);
  });
})();


/* ═══════════════════════════════════════════════
   6. DEPLOYMENT ACTIVITY FEED
═══════════════════════════════════════════════ */
const feedTemplates = [
  {
    type: 'deploy',
    icon: '⬆',
    cls: 'deploy',
    generate: () => {
      const svc = SERVICES[Math.floor(Math.random() * SERVICES.length)];
      const ns  = NAMESPACES[Math.floor(Math.random() * 3)];
      const v   = `v1.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`;
      return {
        title: `<strong>${svc}</strong> deploying to <strong>${ns}</strong>`,
        meta:  `${IMAGES[Math.floor(Math.random() * IMAGES.length)]} · ${Math.floor(Math.random()*3)+1} replicas`,
      };
    }
  },
  {
    type: 'success',
    icon: '✓',
    cls: 'success',
    generate: () => {
      const svc = SERVICES[Math.floor(Math.random() * SERVICES.length)];
      const ns  = NAMESPACES[Math.floor(Math.random() * 3)];
      return {
        title: `<strong>${svc}</strong> rollout complete`,
        meta:  `namespace/${ns} · 0 restarts`,
      };
    }
  },
  {
    type: 'scale',
    icon: '⇧',
    cls: 'scale',
    generate: () => {
      const svc = SERVICES[Math.floor(Math.random() * SERVICES.length)];
      const from = Math.floor(Math.random() * 4) + 2;
      const to   = from + Math.floor(Math.random() * 4) + 1;
      return {
        title: `<strong>${svc}</strong> scaled`,
        meta:  `${from} → ${to} replicas · HPA triggered`,
      };
    }
  },
  {
    type: 'rollback',
    icon: '↩',
    cls: 'rollback',
    generate: () => {
      const svc = SERVICES[Math.floor(Math.random() * SERVICES.length)];
      const v   = `v1.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 9)}`;
      return {
        title: `<strong>${svc}</strong> rolled back to ${v}`,
        meta:  `CrashLoopBackOff detected · auto-remediation`,
      };
    }
  }
];

function timeAgo(seconds) {
  if (seconds < 60)   return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

let feedTimes = [12, 45, 78, 130, 190, 260, 340, 420, 510];

function renderFeed() {
  const container = document.getElementById('activityFeed');
  if (!container) return;
  container.innerHTML = '';

  feedTimes.forEach((sec, i) => {
    const tmpl = feedTemplates[i % feedTemplates.length];
    const { title, meta } = tmpl.generate();

    const el = document.createElement('div');
    el.className = 'feed-item';
    el.style.animationDelay = `${i * 70}ms`;
    el.innerHTML = `
      <div class="fi-icon ${tmpl.cls}">${tmpl.icon}</div>
      <div class="fi-body">
        <div class="fi-title">${title}</div>
        <div class="fi-meta">${meta}</div>
      </div>
      <div class="fi-time">${timeAgo(sec)}</div>
    `;
    container.appendChild(el);
  });
}

renderFeed();

// Live feed: push new item every 7s
setInterval(() => {
  feedTimes = [Math.floor(Math.random() * 8) + 1, ...feedTimes.slice(0, 8)];
  renderFeed();
}, 7000);

// Increment times every second
setInterval(() => {
  feedTimes = feedTimes.map(t => t + 1);
  document.querySelectorAll('.fi-time').forEach((el, i) => {
    el.textContent = timeAgo(feedTimes[i]);
  });
}, 1000);


/* ═══════════════════════════════════════════════
   7. LOG STREAM
═══════════════════════════════════════════════ */
const logMessages = [
  { level: 'INFO',  msgs: [
    'Readiness probe passed for pod api-gateway-7d9f-k8bxp',
    'Sync wave 2 complete · ArgoCD',
    'Certificate renewed for *.kubenova.io',
    'HPA scaled deployment/user-service to 4 replicas',
    'ConfigMap reloaded for monitoring/prometheus-config',
    'Ingress rule updated for api.kubenova.io',
    'Pod scheduler-6cc4b-9xklp scheduled on node worker-03',
    'Backup snapshot completed · etcd-snapshot-2026-05-29',
  ]},
  { level: 'WARN',  msgs: [
    'Memory pressure detected on node worker-02 (87% used)',
    'Slow query detected in postgres-main: 2.3s',
    'Loki ingestion rate high: 15k lines/s',
    'Certificate expiring in 7 days for legacy.kubenova.io',
  ]},
  { level: 'ERROR', msgs: [
    'OOMKilled: pod ml-inference-69bd-r2xzq (container: model-server)',
  ]},
  { level: 'DEBUG', msgs: [
    'Reconciling deployment/frontend (generation 142)',
    'Probe endpoint: GET /health → 200 OK (3ms)',
    'Lease renewed for kube-scheduler',
  ]},
];

function randomLog() {
  const weighted = [
    ...Array(8).fill(logMessages[0]),
    ...Array(3).fill(logMessages[1]),
    ...Array(1).fill(logMessages[2]),
    ...Array(4).fill(logMessages[3]),
  ];
  const bucket = weighted[Math.floor(Math.random() * weighted.length)];
  const msg    = bucket.msgs[Math.floor(Math.random() * bucket.msgs.length)];
  const ns     = NAMESPACES[Math.floor(Math.random() * NAMESPACES.length)];
  const now    = new Date();
  const ts     = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  return { ts, level: bucket.level, ns, msg };
}

function appendLog(entry) {
  const container = document.getElementById('logStream');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'log-line';
  el.innerHTML = `
    <span class="log-ts">${entry.ts}</span>
    <span class="log-level ${entry.level}">${entry.level}</span>
    <span class="log-ns">${entry.ns}</span>
    <span class="log-msg">${entry.msg}</span>
  `;
  container.appendChild(el);

  // Keep last 30 lines
  while (container.children.length > 30) {
    container.removeChild(container.firstChild);
  }
  container.scrollTop = container.scrollHeight;
}

// Seed initial logs
for (let i = 0; i < 12; i++) {
  setTimeout(() => appendLog(randomLog()), i * 100);
}

// Stream logs
setInterval(() => appendLog(randomLog()), 2200);


/* ═══════════════════════════════════════════════
   8. SERVICE MAP (SVG)
═══════════════════════════════════════════════ */
(function renderServiceMap() {
  const container = document.getElementById('serviceMap');
  if (!container) return;

  const nodes = [
    { id: 'ingress',  label: 'Ingress',       x: 50,  y: 50,  color: CSS.blue },
    { id: 'gateway',  label: 'API Gateway',   x: 50,  y: 50,  color: CSS.cyan },
    { id: 'auth',     label: 'Auth',          x: 20,  y: 70,  color: CSS.green },
    { id: 'user',     label: 'User Svc',      x: 50,  y: 80,  color: CSS.green },
    { id: 'data',     label: 'Data Pipeline', x: 80,  y: 70,  color: CSS.purple },
    { id: 'ml',       label: 'ML Infer.',     x: 80,  y: 90,  color: CSS.yellow },
    { id: 'db',       label: 'Postgres',      x: 30,  y: 90,  color: CSS.blue },
  ];

  const edges = [
    ['ingress', 'gateway'], ['gateway', 'auth'], ['gateway', 'user'],
    ['gateway', 'data'], ['auth', 'db'], ['user', 'db'],
    ['data', 'ml'],
  ];

  // Normalize to 0-100 percentage
  const W = 300, H = 140;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.width = '100%';
  svg.style.height = '100%';

  const nodeMap = {};
  nodes.forEach(n => {
    nodeMap[n.id] = { ...n, px: n.x / 100 * W, py: n.y / 100 * H };
  });

  // Reposition for better layout
  const positions = {
    ingress:  { px: 20,  py: 70 },
    gateway:  { px: 80,  py: 70 },
    auth:     { px: 150, py: 35 },
    user:     { px: 150, py: 70 },
    data:     { px: 150, py: 105 },
    db:       { px: 230, py: 50 },
    ml:       { px: 230, py: 100 },
  };
  Object.assign(nodeMap, Object.fromEntries(
    Object.entries(positions).map(([k, v]) => [k, { ...nodeMap[k], ...v }])
  ));

  // Edges
  edges.forEach(([a, b]) => {
    const na = nodeMap[a], nb = nodeMap[b];
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', na.px); line.setAttribute('y1', na.py);
    line.setAttribute('x2', nb.px); line.setAttribute('y2', nb.py);
    line.setAttribute('stroke', 'rgba(0,200,255,0.2)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    // Animated packet
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '2');
    circle.setAttribute('fill', CSS.blue);
    circle.setAttribute('opacity', '0.8');
    const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    anim.setAttribute('dur', `${1.5 + Math.random() * 2}s`);
    anim.setAttribute('repeatCount', 'indefinite');
    anim.setAttribute('path', `M${na.px},${na.py} L${nb.px},${nb.py}`);
    circle.appendChild(anim);
    svg.appendChild(circle);
  });

  // Nodes
  Object.values(nodeMap).forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('cx', n.px); glow.setAttribute('cy', n.py);
    glow.setAttribute('r', '9');
    glow.setAttribute('fill', n.color.replace(/^#/, ''));
    glow.setAttribute('fill', `${n.color}`);
    glow.setAttribute('opacity', '0.12');
    g.appendChild(glow);

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', n.px); dot.setAttribute('cy', n.py);
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', n.color);
    dot.setAttribute('stroke', 'rgba(0,0,0,0.5)');
    dot.setAttribute('stroke-width', '1');
    g.appendChild(dot);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', n.px);
    text.setAttribute('y', n.py + 16);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'rgba(120,155,191,0.9)');
    text.setAttribute('font-size', '8');
    text.setAttribute('font-family', 'JetBrains Mono, monospace');
    text.textContent = n.label;
    g.appendChild(text);

    svg.appendChild(g);
  });

  container.appendChild(svg);
})();


/* ═══════════════════════════════════════════════
   9. HEALTH BAR ANIMATION
═══════════════════════════════════════════════ */
setTimeout(() => {
  const bar = document.getElementById('healthBar');
  if (bar) bar.style.width = '98.4%';
}, 800);


/* ═══════════════════════════════════════════════
   10. TIME SELECTOR
═══════════════════════════════════════════════ */
document.querySelectorAll('.ts-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.ts-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

document.querySelectorAll('.obs-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.obs-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});


/* ═══════════════════════════════════════════════
   11. UPTIME COUNTER (animates 99.90 → 99.97)
═══════════════════════════════════════════════ */
(function animateUptime() {
  const el = document.getElementById('uptimeCount');
  if (!el) return;
  let val = 99.90;
  const target = 99.97;
  const inc = (target - val) / 60;
  const iv = setInterval(() => {
    val = Math.min(target, val + inc);
    el.textContent = val.toFixed(2) + '%';
    if (val >= target) clearInterval(iv);
  }, 30);
})();


/* ═══════════════════════════════════════════════
   12. INTERSECTION OBSERVER — STAGGER ANIMATIONS
═══════════════════════════════════════════════ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.metrics-section, .ops-section, .observability-section').forEach(el => {
  observer.observe(el);
});


/* ═══════════════════════════════════════════════
   13. METRIC CARD GLOW ON HOVER
═══════════════════════════════════════════════ */
document.querySelectorAll('.metric-card').forEach(card => {
  const glowColor = {
    blue:   'rgba(0,200,255,0.05)',
    cyan:   'rgba(0,255,229,0.05)',
    purple: 'rgba(168,85,247,0.05)',
    green:  'rgba(0,255,136,0.05)',
    yellow: 'rgba(255,215,0,0.05)',
  }[card.dataset.glow] || 'rgba(0,200,255,0.05)';

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    card.style.background = `radial-gradient(circle at ${x}% ${y}%, ${glowColor}, var(--glass-bg) 60%)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.background = '';
  });
});


/* ═══════════════════════════════════════════════
   14. CONSOLE EASTER EGG
═══════════════════════════════════════════════ */
console.log(`%c
██╗  ██╗██╗   ██╗██████╗ ███████╗███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ 
██║ ██╔╝██║   ██║██╔══██╗██╔════╝████╗  ██║██╔═══██╗██║   ██║██╔══██╗
█████╔╝ ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║   ██║██║   ██║███████║
██╔═██╗ ██║   ██║██╔══██╗██╔══╝  ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║
██║  ██╗╚██████╔╝██████╔╝███████╗██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║
╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝
`, 'color: #00c8ff; font-size: 8px; font-family: monospace;');

console.log('%cPlatform Engineering Console · v2.4.1', 'color: #00ffe5; font-family: monospace;');
console.log('%c› All systems nominal', 'color: #00ff88; font-family: monospace;');
console.log('%c› kubectl get pods -A → 247/247 Running', 'color: #7a9bbf; font-family: monospace;');
