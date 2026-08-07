// Search input (Map tab) + "All fields" result list (Fields tab) - both
// driven by the same markersData filter/render logic.
import { escapeHTML, groupName } from '../../core/dom.js';
import { markersData } from '../../core/field-data.js';
import * as store from '../../core/store.js';
import { getModeInfo, hasRelevantModeData } from '../map-modes/index.js';
import { switchTab } from '../app-shell/index.js';

let resultList;

function renderList() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const filtered = markersData.filter(m => {
    const p = store.getPlan(m.id);
    const oName = store.ownerName(p.owner).toLowerCase();
    return !q || m.title.toLowerCase().includes(q) || m.label.toLowerCase() === q || oName.includes(q) || (m.group === 'fields' && ('field ' + m.label).includes(q)) || (m.group === 'land' && ('area ' + m.label).includes(q));
  });
  resultList.innerHTML = filtered.map(m => {
    const p = store.getPlan(m.id);
    const info = getModeInfo(m.id);
    const relevant = hasRelevantModeData(m.id);
    const bits = relevant ? [info.label, p.status, p.crop, p.size, p.nextJob].filter(Boolean).join(' · ') : '';
    const ownerStyle = relevant ? `style="border-color:${info.color}; color:#fff;"` : '';
    return `<div class="item" data-id="${m.id}" role="button" tabindex="0" aria-label="${escapeHTML(m.title)}"><span>${m.title}</span><span class="badge badge-outline" ${ownerStyle}>${escapeHTML(bits || (relevant ? groupName(m.group) : 'hidden'))}</span></div>`;
  }).join('') || `<div class="item"><span>No matches</span></div>`;
  resultList.querySelectorAll('.item[data-id]').forEach(el => {
    el.onclick = () => { store.selectMarker(el.dataset.id, { centre: true }); switchTab('map'); };
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); store.selectMarker(el.dataset.id, { centre: true }); switchTab('map'); }
    });
  });
}

export function initSearch() {
  resultList = document.getElementById('resultList');
  document.getElementById('search').addEventListener('input', renderList);
  document.getElementById('search').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const match = markersData.find(m => m.title.toLowerCase() === q || m.label.toLowerCase() === q)
      || markersData.find(m => m.title.toLowerCase().includes(q) || (m.group === 'fields' && ('field ' + m.label).includes(q)) || (m.group === 'land' && ('area ' + m.label).includes(q)));
    if (match) store.selectMarker(match.id, { centre: true });
  });
  store.subscribe('plans', renderList);
  store.subscribe('owners', renderList);
  store.subscribe('mode', renderList);
  renderList();
}
