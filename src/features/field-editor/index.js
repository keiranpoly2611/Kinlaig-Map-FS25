// The "selected marker" detail form: owner/status/crop, land size (auto-locks
// once saved) + field size, soil/pH/nitrogen, priority, next job, notes.
import { escapeHTML, optionHTML, groupName } from '../../core/dom.js';
import { cropOptions, statusOptions, priorityOptions } from '../../core/field-data.js';
import { pfSoilTypes } from '../../data/reference-tables.js';
import * as store from '../../core/store.js';

function ownerOptionHTML(value) {
  const rows = Object.entries(store.owners).sort((a, b) => a[1].name.localeCompare(b[1].name));
  return `<option value="" ${!value ? 'selected' : ''}>— No owner —</option>` + rows.map(([id, o]) => `<option value="${id}" ${id === value ? 'selected' : ''}>${escapeHTML(o.name)}</option>`).join('');
}
function renderSelected() {
  const card = document.getElementById('selectedCard');
  const selected = store.selected;
  if (!selected) { card.innerHTML = `<h2 class="text-lg font-semibold mb-1">Nothing selected</h2><p class="text-sm text-base-content/60">Click a field or land number on the map.</p>`; return; }
  const p = store.getPlan(selected.id);
  const landSizeIsLocked = !!p.landSize && p.landSizeLocked !== false && !store.landSizeUnlockedForEdit;
  card.innerHTML = `
    <h2 class="text-lg font-semibold mb-1">${selected.title}</h2>
    <div class="text-xs text-base-content/50">${groupName(selected.group)} · x:${selected.x} y:${selected.y}</div>
    <p class="text-sm text-base-content/60 mt-1">${selected.description}</p>
    <label class="label mt-2">Owner</label><select id="ownerSel" class="select select-bordered w-full">${ownerOptionHTML(p.owner || '')}</select>
    <label class="label mt-2">Status</label><select id="statusSel" class="select select-bordered w-full">${optionHTML(statusOptions, p.status || '')}</select>
    <label class="label mt-2">Crop / use</label><select id="cropSel" class="select select-bordered w-full">${optionHTML(cropOptions, p.crop || '')}</select>
    <div class="grid grid-cols-2 gap-2 mt-2">
      <div>
        <label class="label">Land size <span class="text-xs text-base-content/50">(fixed)</span></label>
        <div class="flex gap-1.5 flex-nowrap">
          <input id="landSizeTxt" class="input input-bordered flex-1" value="${escapeHTML(p.landSize || '')}" placeholder="Example: 3.10 ha" ${landSizeIsLocked ? 'disabled' : ''} />
          <button type="button" id="landSizeLockBtn" class="btn btn-square" title="${landSizeIsLocked ? 'Unlock to correct' : 'Locks automatically once saved'}"><i class="ti ${landSizeIsLocked ? 'ti-lock' : 'ti-lock-open'}" aria-hidden="true"></i></button>
        </div>
      </div>
      <div>
        <label class="label">Field size</label>
        <input id="sizeTxt" class="input input-bordered w-full" value="${escapeHTML(p.size || '')}" placeholder="Example: 2.45 ha" />
      </div>
      <div>
        <label class="label">Soil texture <span class="text-xs text-base-content/50">(Precision Farming)</span></label>
        <select id="soilTextureSel" class="select select-bordered w-full">${optionHTML(pfSoilTypes, p.soilTexture || '')}</select>
      </div>
      <div>
        <label class="label">Alkaline / pH</label>
        <input id="alkalineTxt" class="input input-bordered w-full" value="${escapeHTML(p.alkaline || '')}" placeholder="Example: 6.5" />
      </div>
      <div>
        <label class="label">Nitrogen</label>
        <input id="nitrogenTxt" class="input input-bordered w-full" value="${escapeHTML(p.nitrogen || '')}" placeholder="Example: 140" />
      </div>
      <div>
        <label class="label">Work priority</label>
        <select id="prioritySel" class="select select-bordered w-full">${optionHTML(priorityOptions, p.priority || '')}</select>
      </div>
      <div class="col-span-2">
        <label class="label">Next job</label>
        <input id="nextJobTxt" class="input input-bordered w-full" value="${escapeHTML(p.nextJob || '')}" placeholder="Example: lime, fertilise, harvest, sell bales" />
      </div>
    </div>
    <p class="text-sm text-base-content/60 mt-1.5">Set Crop, Soil texture, pH and Nitrogen together to get an exact Precision Farming target read in Soil View instead of a generic guess. Leave Soil texture blank if you're not using that mod.</p>
    <label class="label mt-2">Notes</label><textarea id="notesTxt" class="textarea textarea-bordered w-full" placeholder="Example: Buy next, plant barley, contract only, good grass field...">${escapeHTML(p.notes || '')}</textarea>
    <div class="flex gap-2 flex-wrap mt-2.5">
      <button class="btn btn-primary" id="saveSel">Save</button>
      <button class="btn" id="clearSel">Clear marker</button>
    </div>`;
  document.getElementById('saveSel').onclick = () => {
    const landSizeVal = document.getElementById('landSizeTxt').value;
    store.savePlan(selected.id, {
      owner: document.getElementById('ownerSel').value,
      status: document.getElementById('statusSel').value,
      crop: document.getElementById('cropSel').value,
      size: document.getElementById('sizeTxt').value,
      landSize: landSizeVal,
      landSizeLocked: !!landSizeVal.trim(),
      soilTexture: document.getElementById('soilTextureSel').value,
      alkaline: document.getElementById('alkalineTxt').value,
      nitrogen: document.getElementById('nitrogenTxt').value,
      priority: document.getElementById('prioritySel').value,
      nextJob: document.getElementById('nextJobTxt').value,
      notes: document.getElementById('notesTxt').value
    });
  };
  document.getElementById('landSizeLockBtn').onclick = () => {
    if (!landSizeIsLocked) return;
    store.unlockLandSizeForEdit();
    document.getElementById('landSizeTxt')?.focus();
  };
  document.getElementById('clearSel').onclick = () => store.deletePlan(selected.id);
}

function updateStats() {
  const vals = Object.values(store.plans);
  document.getElementById('plannedCount').textContent = vals.filter(p => p.owner || p.status || p.crop || p.size || p.landSize || p.alkaline || p.nitrogen || p.soilTexture || p.priority || p.nextJob || p.notes).length;
  document.getElementById('ownedCount').textContent = vals.filter(p => p.owner).length;
}

export function initFieldEditor() {
  const refresh = () => { renderSelected(); updateStats(); };
  store.subscribe('selection', renderSelected);
  store.subscribe('plans', refresh);
  store.subscribe('owners', refresh);
  refresh();
}
