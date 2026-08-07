// Owner / Crop / Soil / Work map-mode views: legend, mode-button wiring, and
// the classification helpers that decide what color/label a marker gets in
// each mode. map-view and search import the two pure lookup functions
// (getModeInfo, hasRelevantModeData) read-only - this slice owns rendering
// its own legend/buttons via store subscriptions.
import { escapeHTML } from '../../core/dom.js';
import { cropColors, statusColors, priorityColors, soilLegend } from '../../core/field-data.js';
import { pfSoilTypes, pfSoilProps, pfNitrogen } from '../../data/reference-tables.js';
import * as store from '../../core/store.js';
import { planEntries } from '../../core/plan-entries.js';

function parseFirstNumber(value) {
  const m = String(value || '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0].replace(/[^\d.-]/g, '')) : null;
}
function classifyNitrogen(value) {
  const t = String(value || '').toLowerCase();
  if (!t.trim()) return 'unknown';
  if (/low|poor|bad|needs|none|0/.test(t)) return 'low';
  if (/medium|med|ok|average/.test(t)) return 'medium';
  if (/high|good|full|max/.test(t)) return 'high';
  const n = parseFirstNumber(t);
  if (n == null) return 'unknown';
  if (n < 50) return 'low';
  if (n < 100) return 'medium';
  return 'high';
}
function classifyPH(value) {
  const t = String(value || '').toLowerCase();
  if (!t.trim()) return 'unknown';
  if (/acid|low/.test(t)) return 'acidic';
  if (/alkaline|high/.test(t)) return 'alkaline';
  if (/good|ok|neutral|balanced/.test(t)) return 'good';
  const n = parseFirstNumber(t);
  if (n == null) return 'unknown';
  if (n < 6.0) return 'acidic';
  if (n > 7.7) return 'alkaline';
  return 'good';
}
function pfCropEntry(cropName) { return pfNitrogen.find(r => r.crop === cropName) || null; }

// When the field's crop and soil texture are both known and Precision Farming has data for
// that crop, give an exact target-based read instead of the generic low/medium/high guess.
function getPrecisionSoilInfo(p) {
  const soilIdx = pfSoilTypes.indexOf(p.soilTexture);
  const cropEntry = p.crop ? pfCropEntry(p.crop) : null;
  if (!cropEntry || soilIdx === -1) return null;
  const target = cropEntry.target[soilIdx];
  const reduction = cropEntry.reduction[soilIdx];
  const phTarget = pfSoilProps[p.soilTexture].ph;
  const actualN = parseFirstNumber(p.nitrogen);
  const actualPH = parseFirstNumber(p.alkaline);
  const cropTag = `${p.crop} on ${p.soilTexture}`;
  if (actualN == null && actualPH == null) {
    return { color: '#64748b', label: 'Add pH/N readings', detail: `Target: ${phTarget.toFixed(2)} pH, ${target} N (${cropTag})` };
  }
  if (actualPH != null && Math.abs(actualPH - phTarget) > 0.3) {
    const dir = actualPH < phTarget ? 'Low pH' : 'High pH';
    return { color: '#38bdf8', label: dir, detail: `${actualPH} vs ${phTarget.toFixed(2)} target (${cropTag})` };
  }
  if (actualN != null && actualN < reduction) {
    return { color: '#facc15', label: 'Nitrogen low', detail: `${actualN} vs ${target} N target (${cropTag})` };
  }
  if (actualN != null && actualN < target) {
    return { color: '#a3e635', label: 'Below N target', detail: `${actualN} vs ${target} N target (${cropTag})` };
  }
  if (actualN != null) {
    return { color: '#22c55e', label: 'On target', detail: `${actualN}/${target} N (${cropTag})` };
  }
  return { color: '#64748b', label: 'Add nitrogen reading', detail: `Target: ${target} N (${cropTag})` };
}
function getSoilInfo(p) {
  const precise = getPrecisionSoilInfo(p);
  if (precise) return precise;
  const ph = classifyPH(p.alkaline);
  const n = classifyNitrogen(p.nitrogen);
  if (ph === 'acidic') return { color: '#38bdf8', label: 'Low pH', detail: 'Acidic / lime' };
  if (ph === 'alkaline') return { color: '#a855f7', label: 'High alkaline', detail: 'High pH' };
  if (n === 'low') return { color: '#facc15', label: 'Low nitrogen', detail: 'Needs N' };
  if (ph === 'good' && (n === 'medium' || n === 'high')) return { color: '#22c55e', label: 'Soil OK', detail: 'pH + N OK' };
  return { color: '#64748b', label: 'Soil needs review', detail: 'Check pH/N' };
}

export function hasRelevantModeData(id) {
  const p = store.getPlan(id);
  const mode = store.mapMode;
  if (mode === 'owner') return !!store.getOwner(p.owner);
  if (mode === 'crop') return !!p.crop;
  if (mode === 'soil') return !!(p.alkaline || p.nitrogen || p.soilTexture);
  if (mode === 'work') return !!(p.priority || p.status || p.nextJob);
  return store.hasPlan(id);
}
export function getModeInfo(id) {
  const p = store.getPlan(id);
  const mode = store.mapMode;
  if (mode === 'owner') {
    const o = store.getOwner(p.owner);
    return o ? { color: o.color, label: o.name, detail: 'Owner' } : { color: '#64748b', label: 'Unassigned', detail: 'No owner' };
  }
  if (mode === 'crop') {
    const crop = p.crop || '';
    return crop ? { color: cropColors[crop] || '#ec4899', label: crop, detail: 'Crop/use' } : { color: '#64748b', label: 'No crop', detail: 'Add crop/use' };
  }
  if (mode === 'soil') return getSoilInfo(p);
  if (mode === 'work') {
    if (p.priority) return { color: priorityColors[p.priority] || '#f97316', label: p.priority + ' priority', detail: p.nextJob || p.status || 'Work priority' };
    if (p.status) return { color: statusColors[p.status] || '#64748b', label: p.status, detail: p.nextJob || 'Status' };
    if (p.nextJob) return { color: '#f97316', label: p.nextJob, detail: 'Next job' };
    return { color: '#64748b', label: 'No status', detail: 'Add work/status' };
  }
  return { color: '#38bdf8', label: 'Planned', detail: '' };
}

function countBy(fn) {
  const counts = new Map();
  for (const [m, p] of planEntries()) {
    if (m.group !== 'fields') continue;
    const key = fn(m, p);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}
function legendRow(color, label, count = '') {
  return `<div class="flex items-center gap-2 text-sm text-base-content/80"><span class="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/85 shadow" style="background:${color}"></span><span class="flex-1 truncate">${escapeHTML(label)}</span><span class="text-xs text-base-content/50">${escapeHTML(String(count))}</span></div>`;
}
function renderModeLegend() {
  const legend = document.getElementById('modeLegend');
  if (!legend) return;
  let rows = [];
  const mode = store.mapMode;
  if (mode === 'owner') {
    const ownerCounts = countBy((m, p) => store.getOwner(p.owner) ? p.owner : '');
    rows = Object.entries(store.owners).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([id, o]) => legendRow(o.color, o.name, (ownerCounts.get(id) || 0) + ' fields'));
    if (!rows.length) rows.push(legendRow('#64748b', 'No owners added yet', 'blank fields hidden'));
  } else if (mode === 'crop') {
    const cropCounts = countBy((m, p) => p.crop || '');
    const used = [...cropCounts.keys()].filter(Boolean).sort();
    rows = used.map(c => legendRow(cropColors[c] || '#ec4899', c, cropCounts.get(c) + ' fields'));
    if (!rows.length) rows.push(legendRow('#64748b', 'No crop/use data yet', 'blank fields hidden'));
  } else if (mode === 'soil') {
    rows = soilLegend.map(([color, label, desc]) => legendRow(color, label, desc));
  } else if (mode === 'work') {
    rows = Object.entries(statusColors).map(([label, color]) => legendRow(color, label, 'status'));
    rows.push(legendRow('#ef4444', 'Urgent priority', 'overrides status'));
  }
  legend.innerHTML = rows.join('');
}
function updateModeButtons() {
  // "Selected toggle button" convention used throughout this app: plain .btn
  // for inactive, .btn + .btn-primary for the active one - no bespoke CSS needed.
  document.querySelectorAll('.modeBtn').forEach(btn => btn.classList.toggle('btn-primary', btn.dataset.mode === store.mapMode));
}

export function initMapModes() {
  document.querySelectorAll('.modeBtn').forEach(btn => {
    btn.onclick = () => store.setMapMode(btn.dataset.mode);
  });
  const refresh = () => { updateModeButtons(); renderModeLegend(); };
  store.subscribe('mode', refresh);
  store.subscribe('plans', refresh);
  store.subscribe('owners', refresh);
  refresh();
}
