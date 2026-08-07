// Shared application state (plans, owners, active map mode, current selection)
// plus a tiny pub-sub. Feature slices mutate through the actions below and
// subscribe to the events they care about instead of calling into each
// other's render functions directly - that's what keeps this a vertical
// slice architecture instead of one big tangled call graph.
import { markersData } from './field-data.js';

export const CLOUD_MAP_ID = 'kinlaig';

let cloudRoomCode = localStorage.getItem('kinlaig_fs25_cloud_room_v1') || '';
export function getCloudRoomCode() { return cloudRoomCode; }
export function setCloudRoomCode(v) { cloudRoomCode = v; }

export function localSaveKey(base, room = cloudRoomCode) {
  return base + '::' + (room || 'default');
}

// Older versions kept one flat local save regardless of which map was
// active. Copy it into the currently-active map's own namespaced slot once,
// so existing saves aren't lost when this update lands.
(function migrateLegacyLocalSave() {
  ['kinlaig_fs25_clean_plans_v1', 'kinlaig_fs25_owners_v1', 'kinlaig_fs25_map_mode_v1'].forEach(flatKey => {
    const namespacedKey = localSaveKey(flatKey);
    if (localStorage.getItem(flatKey) !== null && localStorage.getItem(namespacedKey) === null) {
      localStorage.setItem(namespacedKey, localStorage.getItem(flatKey));
    }
  });
})();

export let plans = JSON.parse(localStorage.getItem(localSaveKey('kinlaig_fs25_clean_plans_v1')) || '{}');
export let owners = JSON.parse(localStorage.getItem(localSaveKey('kinlaig_fs25_owners_v1')) || '{}');
export let mapMode = localStorage.getItem(localSaveKey('kinlaig_fs25_map_mode_v1')) || 'owner';
export let selected = null;
export let landSizeUnlockedForEdit = false;

let suppressCloudAuto = false;
export function isCloudAutoSuppressed() { return suppressCloudAuto; }

const listeners = { plans: [], owners: [], mode: [], selection: [] };
export function subscribe(event, cb) { listeners[event].push(cb); }
function emit(event, payload) { listeners[event].forEach(cb => cb(payload)); }

function persistPlans() { localStorage.setItem(localSaveKey('kinlaig_fs25_clean_plans_v1'), JSON.stringify(plans)); }
function persistOwners() { localStorage.setItem(localSaveKey('kinlaig_fs25_owners_v1'), JSON.stringify(owners)); }
function persistMode() { localStorage.setItem(localSaveKey('kinlaig_fs25_map_mode_v1'), mapMode); }

export function getPlan(id) { return plans[id] || {}; }
export function hasPlan(id) {
  const p = plans[id] || {};
  return !!(p.owner || p.status || p.crop || p.size || p.landSize || p.alkaline || p.nitrogen || p.soilTexture || p.priority || p.nextJob || p.notes);
}
export function getOwner(id) { return id && owners[id] ? owners[id] : null; }
export function ownerName(id) { const o = getOwner(id); return o ? o.name : ''; }
export function countOwnerAssignments(ownerId) { return Object.values(plans).filter(p => p.owner === ownerId).length; }

export function savePlan(id, plan) {
  plans[id] = plan;
  landSizeUnlockedForEdit = false;
  if (!hasPlan(id)) delete plans[id];
  persistPlans();
  emit('plans');
}
export function deletePlan(id) {
  delete plans[id];
  landSizeUnlockedForEdit = false;
  persistPlans();
  emit('plans');
}
export function clearAllPlans() {
  plans = {};
  persistPlans();
  emit('plans');
}

export function addOwner(id, owner) {
  owners[id] = owner;
  persistOwners();
  emit('owners');
}
export function renameOwner(id, name) {
  owners[id].name = name.trim() || owners[id].name;
  persistOwners();
  emit('owners');
}
export function recolorOwner(id, color) {
  owners[id].color = color;
  persistOwners();
  emit('owners');
}
export function deleteOwner(id) {
  delete owners[id];
  Object.keys(plans).forEach(planId => {
    if (plans[planId].owner === id) plans[planId].owner = '';
    if (!hasPlan(planId)) delete plans[planId];
  });
  persistPlans();
  persistOwners();
  emit('owners');
  emit('plans');
}

export function setMapMode(mode) {
  mapMode = mode;
  persistMode();
  emit('mode');
}

export function selectMarker(id, { centre = false } = {}) {
  selected = markersData.find(m => m.id === id) || null;
  landSizeUnlockedForEdit = false;
  if (!selected) return;
  emit('selection', { centre });
}
export function unlockLandSizeForEdit() {
  landSizeUnlockedForEdit = true;
  emit('selection', { centre: false });
}

export function backupObject() {
  return { version: 5, exportedAt: new Date().toISOString(), mapMode, owners, plans };
}
export function applyBackupObject(imported) {
  if (!imported) throw new Error('No data received');
  suppressCloudAuto = true;
  if (imported.plans) {
    plans = imported.plans || {};
    owners = imported.owners || owners || {};
    if (imported.mapMode) mapMode = imported.mapMode;
  } else {
    plans = imported || {};
  }
  persistPlans();
  persistOwners();
  persistMode();
  emit('mode'); emit('owners'); emit('plans');
  suppressCloudAuto = false;
}
export function switchToActiveMapLocalSave() {
  suppressCloudAuto = true;
  plans = JSON.parse(localStorage.getItem(localSaveKey('kinlaig_fs25_clean_plans_v1')) || '{}');
  owners = JSON.parse(localStorage.getItem(localSaveKey('kinlaig_fs25_owners_v1')) || '{}');
  mapMode = localStorage.getItem(localSaveKey('kinlaig_fs25_map_mode_v1')) || 'owner';
  emit('mode'); emit('owners'); emit('plans');
  suppressCloudAuto = false;
}
