// Pan/zoom/pinch gestures, the coordinate grid overlay, and marker
// rendering/painting on the map canvas.
import { escapeHTML, hexToRgba } from '../../core/dom.js';
import { MAP_W, MAP_H, markersData } from '../../core/field-data.js';
import * as store from '../../core/store.js';
import { getModeInfo, hasRelevantModeData } from '../map-modes/index.js';

let viewport, canvas, markersEl, coordPill, zoomPill, sidebar;
let scale = 1, tx = 0, ty = 0;
let dragging = false, startX = 0, startY = 0, startTx = 0, startTy = 0;
const activePointers = new Map();
let pinchLastDist = 0;
let tapCandidate = null, tapStartX = 0, tapStartY = 0, tapMoved = false, wasMultiTouch = false;

export function getScale() { return scale; }

function applyTransform() {
  canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  zoomPill.textContent = Math.round(scale * 100) + '%';
}
export function fitMap() {
  const pad = 30;
  const sx = (viewport.clientWidth - pad * 2) / MAP_W;
  const sy = (viewport.clientHeight - pad * 2) / MAP_H;
  scale = Math.min(sx, sy);
  tx = (viewport.clientWidth - MAP_W * scale) / 2;
  ty = (viewport.clientHeight - MAP_H * scale) / 2;
  applyTransform();
}
function zoomAt(clientX, clientY, factor) {
  const rect = viewport.getBoundingClientRect();
  const px = clientX - rect.left, py = clientY - rect.top;
  const mx = (px - tx) / scale, my = (py - ty) / scale;
  const next = Math.max(0.45, Math.min(6, scale * factor));
  scale = next;
  tx = px - mx * scale;
  ty = py - my * scale;
  applyTransform();
}
function mapCoordFromEvent(e) {
  const rect = viewport.getBoundingClientRect();
  return { x: Math.round((e.clientX - rect.left - tx) / scale), y: Math.round((e.clientY - rect.top - ty) / scale) };
}
function centreOn(x, y, targetScale = null) {
  if (targetScale) scale = targetScale;
  tx = viewport.clientWidth / 2 - x * scale;
  ty = viewport.clientHeight / 2 - y * scale;
  applyTransform();
}
function ensureMarkerVisible(x, y) {
  const margin = 60;
  const vx = x * scale + tx, vy = y * scale + ty;
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if (vx < margin || vx > w - margin || vy < margin || vy > h - margin) centreOn(x, y, scale);
}

function createGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  for (let x = 0; x <= MAP_W; x += 100) {
    const l = document.createElement('div'); l.className = 'grid-line'; l.style.left = x + 'px'; l.style.top = '0'; l.style.width = '1px'; l.style.height = MAP_H + 'px'; grid.appendChild(l);
    const lab = document.createElement('div'); lab.className = 'grid-label'; lab.style.left = (x + 3) + 'px'; lab.style.top = '3px'; lab.textContent = x; grid.appendChild(lab);
  }
  for (let y = 0; y <= MAP_H; y += 100) {
    const l = document.createElement('div'); l.className = 'grid-line'; l.style.left = '0'; l.style.top = y + 'px'; l.style.height = '1px'; l.style.width = MAP_W + 'px'; grid.appendChild(l);
    const lab = document.createElement('div'); lab.className = 'grid-label'; lab.style.left = '3px'; lab.style.top = (y + 3) + 'px'; lab.textContent = y; grid.appendChild(lab);
  }
}

function renderMarkers() {
  markersEl.innerHTML = '';
  for (const m of markersData) {
    const el = document.createElement('div');
    el.className = `marker ${m.group}`;
    el.dataset.id = m.id; el.dataset.group = m.group;
    el.style.left = m.x + 'px'; el.style.top = m.y + 'px';
    el.title = m.title;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', m.title);
    el.innerHTML = `<span class="marker-label">${escapeHTML(m.label)}</span><span class="owner-dot"></span><span class="owner-name"></span>`;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); store.selectMarker(m.id, { centre: true }); }
    });
    el.addEventListener('focus', () => ensureMarkerVisible(m.x, m.y));
    markersEl.appendChild(el);
  }
  paintMarkers();
}

export function paintMarkers() {
  const showModeColours = document.getElementById('ownerToggle')?.checked ?? true;
  const showModeLabels = document.getElementById('ownerNameToggle')?.checked ?? true;
  document.querySelectorAll('.marker').forEach(el => {
    const id = el.dataset.id;
    const info = getModeInfo(id);
    const relevant = hasRelevantModeData(id);
    const showColourForMarker = showModeColours && relevant;
    el.classList.toggle('selected', store.selected && store.selected.id === id);
    el.setAttribute('aria-pressed', store.selected && store.selected.id === id ? 'true' : 'false');
    // When mode colours are on, only fields with data relevant to the current mode get a visible overlay.
    // Blank/non-relevant fields remain invisible but still clickable through the printed field numbers.
    el.classList.toggle('planned', !showModeColours && store.hasPlan(id));
    el.classList.toggle('modeColoured', showColourForMarker);
    if (showColourForMarker) {
      el.style.setProperty('--mode-color', info.color);
      el.style.setProperty('--mode-bg', hexToRgba(info.color, 0.23));
      const nameEl = el.querySelector('.owner-name');
      if (nameEl) nameEl.textContent = info.label;
      el.title = `${markersData.find(m => m.id === id)?.title || id} — ${info.label}${info.detail ? ' · ' + info.detail : ''}`;
    } else {
      el.style.removeProperty('--mode-color');
      el.style.removeProperty('--mode-bg');
      const nameEl = el.querySelector('.owner-name');
      if (nameEl) nameEl.textContent = '';
      const base = markersData.find(m => m.id === id)?.title || id;
      el.title = relevant ? base : `${base} — hidden until ${store.mapMode} data is added`;
    }
    const layerOn = document.querySelector(`input[data-layer="${el.dataset.group}"]`)?.checked ?? true;
    el.style.display = layerOn ? 'block' : 'none';
  });
  canvas.classList.toggle('showHits', document.getElementById('hitToggle')?.checked);
  canvas.classList.toggle('showModeLabels', showModeColours && showModeLabels);
}

function endPointer(e) {
  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) pinchLastDist = 0;
  if (activePointers.size === 0) { dragging = false; viewport.classList.remove('dragging'); tapCandidate = null; }
}

export function initMapView() {
  viewport = document.getElementById('viewport');
  canvas = document.getElementById('canvas');
  markersEl = document.getElementById('markers');
  coordPill = document.getElementById('coordPill');
  zoomPill = document.getElementById('zoomPill');
  sidebar = document.getElementById('sidebar');

  viewport.addEventListener('pointerdown', e => {
    try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size === 1) {
      dragging = true; startX = e.clientX; startY = e.clientY; startTx = tx; startTy = ty;
      viewport.classList.add('dragging');
      tapCandidate = e.target.closest('.marker');
      tapStartX = e.clientX; tapStartY = e.clientY; tapMoved = false; wasMultiTouch = false;
    } else if (activePointers.size === 2) {
      dragging = false; viewport.classList.remove('dragging');
      wasMultiTouch = true;
      const pts = [...activePointers.values()];
      pinchLastDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
  });
  viewport.addEventListener('pointermove', e => {
    if (e.target.closest('#viewport')) { const c = mapCoordFromEvent(e); coordPill.textContent = `x: ${c.x} · y: ${c.y}`; }
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.size >= 2) {
      const pts = [...activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2, midY = (pts[0].y + pts[1].y) / 2;
      if (pinchLastDist > 0 && dist > 0) zoomAt(midX, midY, dist / pinchLastDist);
      pinchLastDist = dist;
    } else if (dragging) {
      if (Math.hypot(e.clientX - tapStartX, e.clientY - tapStartY) > 6) tapMoved = true;
      tx = startTx + (e.clientX - startX); ty = startTy + (e.clientY - startY); applyTransform();
    }
  });
  // setPointerCapture on the viewport can stop the browser's native click event from
  // reaching the marker underneath the pointer, so tap-to-select is handled manually here
  // instead of relying on a click listener on each marker.
  viewport.addEventListener('pointerup', e => {
    if (activePointers.size === 1 && !wasMultiTouch && !tapMoved && tapCandidate) {
      store.selectMarker(tapCandidate.dataset.id, { centre: true });
    }
    endPointer(e);
  });
  viewport.addEventListener('pointercancel', endPointer);
  viewport.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 0.89); }, { passive: false });

  ['resetView', 'fitView'].forEach(id => document.getElementById(id).onclick = fitMap);
  document.getElementById('zoomIn').onclick = () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1.2);
  document.getElementById('zoomOut').onclick = () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 0.83);
  document.getElementById('gridToggle').onchange = e => document.getElementById('grid').style.display = e.target.checked ? 'block' : 'none';
  document.getElementById('hitToggle').onchange = paintMarkers;
  document.getElementById('ownerToggle').onchange = paintMarkers;
  document.getElementById('ownerNameToggle').onchange = paintMarkers;
  document.querySelectorAll('input[data-layer]').forEach(cb => cb.onchange = paintMarkers);
  window.addEventListener('resize', fitMap);

  store.subscribe('plans', paintMarkers);
  store.subscribe('owners', paintMarkers);
  store.subscribe('mode', paintMarkers);
  store.subscribe('selection', ({ centre }) => {
    paintMarkers();
    if (centre && store.selected) centreOn(store.selected.x, store.selected.y, Math.max(scale, 2.2));
    sidebar.classList.remove('open');
  });

  createGrid();
  renderMarkers();
  fitMap();
}
