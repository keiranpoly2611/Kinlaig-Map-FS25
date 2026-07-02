/**
 * Kinlaig FS25 Interactive Map - Google Sheets Cloud Sync Backend
 *
 * Setup:
 * 1. Create a Google Sheet.
 * 2. Open Extensions > Apps Script.
 * 3. Paste this whole file into Code.gs.
 * 4. Change ACCESS_CODE below to your own shared edit code.
 * 5. Deploy > New deployment > Web app.
 * 6. Execute as: Me.
 * 7. Who has access: Anyone with the link.
 * 8. Copy the Web App URL ending in /exec and paste it into the map's Cloud Sync panel.
 */

const SHEET_NAME = 'KinlaigCloudData';
const ACCESS_CODE = 'CHANGE-ME'; // Change this. Everyone who edits the map must use this same code.

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const callback = params.callback || '';
  const result = handleRequest_(params);

  // JSONP response for loading from a local HTML file without browser CORS drama.
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(result) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return json_(result);
}

function doPost(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  return json_(handleRequest_(params));
}

function handleRequest_(params) {
  try {
    if (ACCESS_CODE === 'CHANGE-ME') {
      return { ok: false, error: 'Server setup incomplete: change ACCESS_CODE in the Apps Script before using this.' };
    }
    if (ACCESS_CODE && params.token !== ACCESS_CODE) {
      return { ok: false, error: 'Wrong edit code' };
    }

    const mode = params.mode || 'load';

    if (mode === 'save') {
      const dataText = params.data || '';
      if (!dataText) return { ok: false, error: 'No map data received' };

      // Validate that the data is real JSON before saving.
      JSON.parse(dataText);

      // Guard against two players uploading at the same moment and interleaving writes.
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        const sheet = getSheet_();
        sheet.getRange(1, 1, 1, 4).setValues([['updatedAt', 'updatedBy', 'version', 'data']]);
        sheet.getRange(2, 1, 1, 4).setValues([[new Date(), params.user || '', 'v1', dataText]]);
        sheet.autoResizeColumns(1, 3);
      } finally {
        lock.releaseLock();
      }

      return { ok: true, savedAt: new Date().toISOString() };
    }

    const sheet = getSheet_();
    const dataText = sheet.getRange(2, 4).getValue();
    if (!dataText) {
      return { ok: true, data: null, message: 'No cloud save exists yet' };
    }

    return {
      ok: true,
      data: JSON.parse(dataText),
      loadedAt: new Date().toISOString()
    };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
