(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!(toggle instanceof HTMLButtonElement) || !menu) return;
  const close = () => { toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','Öppna meny'); menu.setAttribute('data-open','false'); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Stäng meny':'Öppna meny');
    menu.setAttribute('data-open',String(open));
  });
  menu.addEventListener('click', event => { if (event.target instanceof HTMLAnchorElement) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { close(); toggle.focus(); } });
  matchMedia('(min-width: 1051px)').addEventListener('change', close);
})();
