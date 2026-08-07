import { markersData } from './field-data.js';
import { getPlan } from './store.js';

export function fieldEntries() { return markersData.filter(m => m.group === 'fields'); }
export function planEntries() { return markersData.map(m => [m, getPlan(m.id)]); }
