// Owner CRUD (Fields tab): create/rename/recolor/delete owners, and the
// "click an owner to see their fields" drill-down list.
import { escapeHTML } from '../../core/dom.js';
import { ownerPalette, markersData } from '../../core/field-data.js';
import * as store from '../../core/store.js';
import { switchTab } from '../app-shell/index.js';

let selectedOwnerFilter = null;

function renderOwners() {
  const list = document.getElementById('ownersList');
  if (!list) return;
  const entries = Object.entries(store.owners).sort((a, b) => a[1].name.localeCompare(b[1].name));
  list.innerHTML = entries.length ? entries.map(([id, o]) => `
    <div class="grid grid-cols-[26px_minmax(0,1fr)_48px_62px] gap-2 items-center bg-base-100 border border-base-content/15 rounded-xl p-2" data-owner-id="${id}">
      <span class="w-[18px] h-[18px] rounded-full border-2 border-white/90 shadow cursor-pointer" data-owner-view="${id}" role="button" tabindex="0" aria-label="View ${escapeHTML(o.name)}'s fields" style="background:${o.color}"></span>
      <div>
        <input type="text" class="input input-sm input-bordered w-full" data-owner-name="${id}" value="${escapeHTML(o.name)}" />
        <div class="text-xs text-primary flex items-center gap-1 mt-1 cursor-pointer" data-owner-view="${id}" role="button" tabindex="0">${store.countOwnerAssignments(id)} assigned <i class="ti ti-chevron-right" aria-hidden="true"></i></div>
      </div>
      <input type="color" class="input input-sm p-1 w-12" data-owner-color="${id}" value="${o.color}" />
      <button class="btn btn-sm btn-error btn-outline" data-owner-delete="${id}">Delete</button>
    </div>`).join('') : `<p class="text-sm text-base-content/60">No owners yet. Add your player/farm names above, then assign them to fields.</p>`;
  list.querySelectorAll('[data-owner-name]').forEach(input => {
    input.onchange = () => store.renameOwner(input.dataset.ownerName, input.value);
  });
  list.querySelectorAll('[data-owner-color]').forEach(input => {
    input.onchange = () => store.recolorOwner(input.dataset.ownerColor, input.value);
  });
  list.querySelectorAll('[data-owner-view]').forEach(el => {
    el.onclick = () => showOwnerFields(el.dataset.ownerView);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showOwnerFields(el.dataset.ownerView); } });
  });
  list.querySelectorAll('[data-owner-delete]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.ownerDelete;
      const uses = store.countOwnerAssignments(id);
      if (!confirm(`Delete ${store.owners[id].name}?${uses ? ' This will remove the owner from ' + uses + ' field/area assignment(s).' : ''}`)) return;
      store.deleteOwner(id);
      if (selectedOwnerFilter === id) backToOwnersList();
    };
  });
  if (selectedOwnerFilter) renderOwnerFieldsList();
}

function showOwnerFields(id) {
  selectedOwnerFilter = id;
  document.getElementById('ownersListView').style.display = 'none';
  document.getElementById('ownerFieldsView').style.display = 'block';
  const o = store.owners[id];
  document.getElementById('ownerFieldsHeader').innerHTML = o ? `<span class="inline-block w-[18px] h-[18px] rounded-full" style="background:${o.color}"></span>${escapeHTML(o.name)}` : '';
  renderOwnerFieldsList();
}
function backToOwnersList() {
  selectedOwnerFilter = null;
  document.getElementById('ownersListView').style.display = 'block';
  document.getElementById('ownerFieldsView').style.display = 'none';
}
function renderOwnerFieldsList() {
  const id = selectedOwnerFilter;
  const listEl = document.getElementById('ownerFieldsList');
  if (!id || !listEl) return;
  const fields = markersData.filter(m => store.getPlan(m.id).owner === id);
  listEl.innerHTML = fields.length ? fields.map(m => {
    const p = store.getPlan(m.id);
    const bits = [p.status, p.crop, p.size, p.nextJob].filter(Boolean).join(' · ');
    return `<div class="item" data-id="${m.id}" role="button" tabindex="0" aria-label="${escapeHTML(m.title)}"><span>${m.title}</span><span class="badge badge-outline">${escapeHTML(bits || 'no details yet')}</span></div>`;
  }).join('') : `<p class="text-sm text-base-content/60">No fields assigned to this player yet.</p>`;
  listEl.querySelectorAll('.item[data-id]').forEach(el => {
    el.onclick = () => { store.selectMarker(el.dataset.id, { centre: true }); switchTab('map'); };
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); store.selectMarker(el.dataset.id, { centre: true }); switchTab('map'); } });
  });
}

function addOwnerFromInputs() {
  const nameInput = document.getElementById('newOwnerName');
  const colorInput = document.getElementById('newOwnerColor');
  const name = nameInput.value.trim();
  if (!name) { alert('Type an owner/farm name first.'); return; }
  const id = 'owner-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  store.addOwner(id, { name, color: colorInput.value || ownerPalette[Object.keys(store.owners).length % ownerPalette.length] });
  nameInput.value = '';
  colorInput.value = ownerPalette[Object.keys(store.owners).length % ownerPalette.length];
}

export function initOwners() {
  document.getElementById('addOwnerBtn').onclick = addOwnerFromInputs;
  document.getElementById('backToOwners').onclick = backToOwnersList;
  document.getElementById('newOwnerName').addEventListener('keydown', e => { if (e.key === 'Enter') addOwnerFromInputs(); });
  store.subscribe('owners', renderOwners);
  store.subscribe('plans', renderOwners);
  renderOwners();
}
