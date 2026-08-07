import './styles/main.css';

import { initAppShell } from './features/app-shell/index.js';
import { initMapModes } from './features/map-modes/index.js';
import { initCloudSync } from './features/cloud-sync/index.js';
import { initOwners } from './features/owners/index.js';
import { initMapView } from './features/map-view/index.js';
import { initFieldEditor } from './features/field-editor/index.js';
import { initSearch } from './features/search/index.js';
import { initGuide } from './features/guide/index.js';

initAppShell();
initMapModes();
initCloudSync();
initOwners();
initMapView();
initFieldEditor();
initSearch();
initGuide();
