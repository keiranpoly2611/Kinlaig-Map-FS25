// Supabase cloud sync (multiplayer beta) + local JSON export/import/clear-all
// backup, all sharing the same backupObject() format.
import * as store from '../../core/store.js';

// Shared Supabase backend - same project/keys used by every FS25 map, only
// CLOUD_MAP_ID differs per map. Friends never see or enter these; they only
// need the shared edit code.
const SUPABASE_URL = 'https://aicyvaqkzqlijffqihzd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CwwYHTsXQPiQ-vJlO1_Onw_lo5WaAzE';

let cloudToken = localStorage.getItem('kinlaig_fs25_cloud_token_v1') || '';
let cloudUserName = localStorage.getItem('kinlaig_fs25_cloud_user_v1') || '';
let autoCloud = localStorage.getItem('kinlaig_fs25_cloud_auto_v1') === 'true';
let lastCloudSeen = null;
let cloudAutoTimer = null;

function setCloudStatus(message, tone = '') {
  const el = document.getElementById('cloudStatus');
  if (!el) return;
  el.className = 'cloudStatus' + (tone ? ' ' + tone : '');
  el.textContent = message;
}
function getCloudRoomCode() { return (document.getElementById('cloudRoomCode')?.value ?? store.getCloudRoomCode() ?? '').trim(); }
function getCloudToken() { return (document.getElementById('cloudToken')?.value ?? cloudToken ?? '').trim(); }
function getCloudUserName() { return (document.getElementById('cloudUserName')?.value ?? cloudUserName ?? '').trim(); }

function saveCloudSettings() {
  store.setCloudRoomCode(getCloudRoomCode());
  cloudToken = getCloudToken();
  cloudUserName = getCloudUserName();
  autoCloud = !!document.getElementById('autoCloudToggle')?.checked;
  localStorage.setItem('kinlaig_fs25_cloud_room_v1', store.getCloudRoomCode());
  localStorage.setItem('kinlaig_fs25_cloud_token_v1', cloudToken);
  localStorage.setItem('kinlaig_fs25_cloud_user_v1', cloudUserName);
  localStorage.setItem('kinlaig_fs25_cloud_auto_v1', String(autoCloud));
  setCloudStatus(cloudToken ? 'Cloud setup saved on this device. Use Load from cloud or Upload current map.' : 'Shared edit code is empty. Local saving still works.', cloudToken ? 'ok' : 'warn');
}

function setCreateRoomStatus(message, tone = '') {
  const el = document.getElementById('createRoomStatus');
  if (!el) return;
  el.className = 'cloudStatus' + (tone ? ' ' + tone : '');
  el.textContent = message;
}
function generateRoomCode() {
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  const el = document.getElementById('newRoomCode');
  if (el) el.value = code;
}
async function createRoom() {
  const room = (document.getElementById('newRoomCode')?.value || '').trim();
  const code = (document.getElementById('newRoomEditCode')?.value || '').trim();
  const name = (document.getElementById('newRoomCreatorName')?.value || '').trim();
  if (!room) { setCreateRoomStatus('Enter or generate a map code first.', 'warn'); return; }
  if (!code) { setCreateRoomStatus('Choose an edit code (password) for this map.', 'warn'); return; }
  setCreateRoomStatus('Creating map…');
  try {
    await supabaseRpc('fs25_create_room', { p_map_id: store.CLOUD_MAP_ID, p_room_code: room, p_code: code, p_created_by: name });
    const roomEl = document.getElementById('cloudRoomCode');
    const tokenEl = document.getElementById('cloudToken');
    const nameEl = document.getElementById('cloudUserName');
    if (roomEl) roomEl.value = room;
    if (tokenEl) tokenEl.value = code;
    if (name && nameEl) nameEl.value = name;
    saveCloudSettings();
    store.switchToActiveMapLocalSave();
    setCreateRoomStatus(`Map "${room}" created! Share the map code and edit code with your friends - they enter both into Cloud sync below to join.`, 'ok');
  } catch (err) {
    setCreateRoomStatus('Could not create map: ' + err.message, 'bad');
  }
}

function scheduleCloudAutoSave() {
  if (!autoCloud || store.isCloudAutoSuppressed() || !getCloudToken()) return;
  clearTimeout(cloudAutoTimer);
  cloudAutoTimer = setTimeout(() => cloudSave(true), 1200);
}

async function supabaseRpc(fn, body) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    body: JSON.stringify(body)
  });
  let json = null;
  try { json = await res.json(); } catch (e) { /* empty body is fine */ }
  if (!res.ok) throw new Error((json && json.message) || 'Cloud request failed');
  return Array.isArray(json) ? json[0] : json;
}

async function cloudLoad() {
  saveCloudSettings();
  const token = getCloudToken();
  const room = getCloudRoomCode();
  if (!token) { setCloudStatus('Enter the shared edit code first.', 'warn'); return; }
  store.switchToActiveMapLocalSave();
  setCloudStatus(room ? `Loading map ${room}…` : 'Loading from cloud…');
  try {
    const row = await supabaseRpc('fs25_load_map', { p_map_id: store.CLOUD_MAP_ID, p_code: token, p_room_code: room });
    if (!row || !row.data) { setCloudStatus('Cloud is connected, but there is no saved map data yet. Upload your current map first.', 'warn'); return; }
    store.applyBackupObject(row.data);
    lastCloudSeen = { updatedAt: row.updated_at || null, updatedBy: row.updated_by || '' };
    const who = row.updated_by ? ` Last updated by ${row.updated_by}${row.updated_at ? ' at ' + new Date(row.updated_at).toLocaleString() : ''}.` : '';
    setCloudStatus('Loaded shared cloud data. Local map is now updated.' + who, 'ok');
  } catch (err) {
    setCloudStatus('Cloud load failed: ' + err.message, 'bad');
  }
}
async function cloudPeek() {
  const token = getCloudToken();
  if (!token) return null;
  try {
    return await supabaseRpc('fs25_load_map', { p_map_id: store.CLOUD_MAP_ID, p_code: token, p_room_code: getCloudRoomCode() });
  } catch (e) {
    return null;
  }
}
async function cloudSave(silent = false) {
  saveCloudSettings();
  const token = getCloudToken();
  if (!token) { if (!silent) setCloudStatus('Enter the shared edit code first.', 'warn'); return; }
  if (!silent && lastCloudSeen) {
    const row = await cloudPeek();
    if (row && row.updated_at && row.updated_at !== lastCloudSeen.updatedAt) {
      const who = row.updated_by || 'someone';
      const when = new Date(row.updated_at).toLocaleString();
      const proceed = confirm(`Cloud was updated by ${who} at ${when}, after you last loaded. Uploading now will overwrite their changes.\n\nUpload anyway?`);
      if (!proceed) { setCloudStatus('Upload cancelled. Press "Load from cloud" to see the latest changes first.', 'warn'); return; }
    }
  }
  await doCloudSave(silent);
}
async function doCloudSave(silent = false) {
  const token = getCloudToken();
  const room = getCloudRoomCode();
  if (!silent) setCloudStatus(room ? `Uploading to map ${room}…` : 'Uploading current map to cloud…');
  try {
    const row = await supabaseRpc('fs25_save_map', {
      p_map_id: store.CLOUD_MAP_ID,
      p_code: token,
      p_data: store.backupObject(),
      p_updated_by: getCloudUserName(),
      p_room_code: room
    });
    if (row && row.saved_at) lastCloudSeen = { updatedAt: row.saved_at, updatedBy: getCloudUserName() };
    setCloudStatus('Uploaded and confirmed by the cloud. Other players should press Load from cloud to see it.', 'ok');
  } catch (err) {
    setCloudStatus('Cloud upload failed: ' + err.message, 'bad');
  }
}

function initCloudUI() {
  const roomEl = document.getElementById('cloudRoomCode');
  const tokenEl = document.getElementById('cloudToken');
  const nameEl = document.getElementById('cloudUserName');
  const autoEl = document.getElementById('autoCloudToggle');
  if (roomEl) roomEl.value = store.getCloudRoomCode();
  if (tokenEl) tokenEl.value = cloudToken;
  if (nameEl) nameEl.value = cloudUserName;
  if (autoEl) autoEl.checked = autoCloud;
  document.getElementById('saveCloudSettings').onclick = saveCloudSettings;
  document.getElementById('loadCloudBtn').onclick = cloudLoad;
  document.getElementById('saveCloudBtn').onclick = () => cloudSave(false);
  document.getElementById('generateRoomBtn').onclick = generateRoomCode;
  document.getElementById('createRoomBtn').onclick = createRoom;
  if (autoEl) autoEl.onchange = saveCloudSettings;
  setCloudStatus(cloudToken ? 'Cloud setup found on this device. Load from cloud before editing, then upload when done.' : 'Cloud is not set up yet. Enter the shared edit code above.', cloudToken ? 'ok' : '');
}

function initBackup() {
  document.getElementById('exportBtn').onclick = () => {
    const backup = store.backupObject();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kinlaig-fs25-farm-management-backup.json'; a.click(); URL.revokeObjectURL(a.href);
  };
  document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
  document.getElementById('importFile').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      store.applyBackupObject(imported);
    } catch (err) { alert('That JSON file could not be imported.'); }
  };
  document.getElementById('clearAll').onclick = () => { if (confirm('Clear all saved Kinlaig plans?')) store.clearAllPlans(); };
}

export function initCloudSync() {
  initCloudUI();
  initBackup();
  store.subscribe('plans', () => scheduleCloudAutoSave());
  store.subscribe('owners', () => scheduleCloudAutoSave());
}
