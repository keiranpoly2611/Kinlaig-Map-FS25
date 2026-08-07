// App chrome: tab switching, the dismissible quick-start card, and the
// mobile sidebar toggle. No shared app data involved.

export function switchTab(tab) {
  document.querySelectorAll('.tabBtn').forEach(b => {
    b.classList.toggle('btn-primary', b.dataset.tab === tab);
    b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  });
  document.querySelectorAll('.tabPanel').forEach(p => {
    const isActive = p.dataset.panel === tab;
    p.classList.toggle('active', isActive);
    p.classList.remove('fadein');
    if (isActive) {
      void p.offsetWidth;
      requestAnimationFrame(() => p.classList.add('fadein'));
    }
  });
}

export function initAppShell() {
  document.querySelectorAll('.tabBtn').forEach(btn => { btn.onclick = () => switchTab(btn.dataset.tab); });

  const sidebar = document.getElementById('sidebar');
  document.getElementById('openSide').onclick = () => sidebar.classList.toggle('open');

  if (!localStorage.getItem('kinlaig_fs25_seen_intro_v1')) document.getElementById('introCard').style.display = 'block';
  document.getElementById('dismissIntro').onclick = () => {
    localStorage.setItem('kinlaig_fs25_seen_intro_v1', 'true');
    document.getElementById('introCard').style.display = 'none';
  };
}
