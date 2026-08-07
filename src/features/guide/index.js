// Static reference tables for the Guide tab: vanilla crop guide + Precision
// Farming soil/nitrogen/headroom tables. No store data involved - renders once.
import { escapeHTML } from '../../core/dom.js';
import { pfSoilTypes, pfSoilProps, pfNitrogen, pfHeadroom, vanillaCrops } from '../../data/reference-tables.js';

function renderVanillaCropTable() {
  const el = document.getElementById('vanillaCropTable');
  if (!el) return;
  const rows = vanillaCrops.map(c => `<tr><td class="font-semibold whitespace-nowrap">${escapeHTML(c.crop)}<small class="block text-base-content/50 font-medium">${escapeHTML(c.category)}</small></td><td>${escapeHTML(c.plant)}</td><td>${escapeHTML(c.harvest)}</td><td class="text-left">${escapeHTML(c.equipment)}</td><td>${escapeHTML(c.price)}</td></tr>`).join('');
  el.innerHTML = `<div class="overflow-x-auto mt-2"><table class="table table-xs"><thead><tr><th>Crop</th><th>Plant</th><th>Harvest</th><th>Equipment needed</th><th>Price/1000L</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function pfHeatColor(v) {
  if (v <= 0) return { bg: '#ef4444', fg: '#fff' };
  if (v <= 70) return { bg: '#f97316', fg: '#1a1200' };
  if (v <= 110) return { bg: '#facc15', fg: '#1a1200' };
  if (v <= 150) return { bg: '#a3e635', fg: '#132000' };
  if (v <= 190) return { bg: '#22c55e', fg: '#04170c' };
  return { bg: '#14b8a6', fg: '#03231d' };
}
function refCell(value, sub) {
  const c = pfHeatColor(value);
  const subHtml = sub != null ? `<small>${escapeHTML(String(sub))}</small>` : '';
  return `<td><span class="refCell" style="background:${c.bg};color:${c.fg}">${escapeHTML(String(value))}${subHtml}</span></td>`;
}
function renderPFSoilTable() {
  const el = document.getElementById('pfSoilTable');
  if (!el) return;
  const rows = pfSoilTypes.map(s => {
    const p = pfSoilProps[s];
    return `<tr><td class="font-semibold whitespace-nowrap">${escapeHTML(s)}</td><td>${p.ph.toFixed(2)}</td><td>${p.maxYield}%</td></tr>`;
  }).join('');
  el.innerHTML = `<div class="overflow-x-auto mt-2"><table class="table table-xs"><thead><tr><th>Soil type</th><th>Target pH</th><th>Base yield</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function renderPFNitrogenTable() {
  const el = document.getElementById('pfNitrogenTable');
  if (!el) return;
  const head = `<tr><th>Crop</th>${pfSoilTypes.map(s => `<th>${escapeHTML(s)}</th>`).join('')}</tr>`;
  const rows = pfNitrogen.map(row => {
    const tagsHtml = row.tags.length ? `<span class="refTags">${row.tags.join(' &middot; ')}</span>` : '';
    const cells = row.target.map((t, i) => refCell(t, `red ${row.reduction[i]}`)).join('');
    return `<tr><td class="font-semibold whitespace-nowrap">${escapeHTML(row.crop)}${tagsHtml}</td>${cells}</tr>`;
  }).join('');
  el.innerHTML = `<div class="overflow-x-auto mt-2"><table class="table table-xs"><thead>${head}</thead><tbody>${rows}</tbody></table></div><p class="text-sm text-base-content/60 mt-1.5">Each cell: N Target, with N Reduction level below it.</p>`;
}
function renderPFHeadroomTable() {
  const el = document.getElementById('pfHeadroomTable');
  if (!el) return;
  const head = `<tr><th>Crop</th>${pfSoilTypes.map(s => `<th>${escapeHTML(s)}</th>`).join('')}<th>Over-fert effect?</th></tr>`;
  const rows = pfHeadroom.map(row => {
    const cells = row.netLeft.map(n => `<td>${n}</td>`).join('');
    const overHtml = row.over ? '<span class="pfOver-yes">Yes</span>' : '<span class="pfOver-no">No</span>';
    return `<tr><td class="font-semibold whitespace-nowrap">${escapeHTML(row.crop)}</td>${cells}<td>${overHtml}</td></tr>`;
  }).join('');
  el.innerHTML = `<div class="overflow-x-auto mt-2"><table class="table table-xs"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}

export function initGuide() {
  renderVanillaCropTable();
  renderPFSoilTable();
  renderPFNitrogenTable();
  renderPFHeadroomTable();
}
