export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function optionHTML(options, value) {
  return options.map(o => `<option value="${o}" ${o === value ? 'selected' : ''}>${o || '—'}</option>`).join('');
}

export function groupName(g) { return g === 'fields' ? 'Field' : 'Land/Area'; }

export function hexToRgba(hex, alpha = 0.22) {
  const clean = String(hex || '#38bdf8').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
