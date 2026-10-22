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

// Preview is entirely dormant for ordinary visitors.
(() => {
  if (!document.cookie.split(';').some(item => item.trim() === 'sitecms_preview_active=1')) return;
  let panelOrigin = null;
  let overlays = true;
  let generation = 0;
  const framed = window.parent !== window;
  const fields = () => [...document.querySelectorAll('[data-sitecms]')];
  const identity = element => {
    const [page, key] = (element.getAttribute('data-sitecms') || '').split(':');
    return { page, key };
  };
  const targets = (page, key) => fields().filter(element => {
    const id = identity(element);
    return id.page === page && id.key === key;
  });
  const send = (type, payload = {}) => {
    if (panelOrigin && framed) window.parent.postMessage({ source: 'sitecms-preview', v: 1, type, ...payload }, panelOrigin);
  };
  const lockForms = () => {
    for (const form of document.forms) {
      for (const control of form.querySelectorAll('input,select,textarea,button')) control.disabled = true;
      form.setAttribute('aria-disabled', 'true');
    }
  };
  lockForms();
  document.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); }, true);
  const style = document.createElement('style');
  style.textContent = '[data-sitecms].sitecms-overlay{outline:1px dashed #c5a000;outline-offset:3px;cursor:pointer}.sitecms-flash{animation:sitecms-flash 1s ease-in-out 2}@keyframes sitecms-flash{50%{outline:4px solid #edca28;background-color:#edca2833}}#sitecms-preview-bar{position:fixed;bottom:12px;left:12px;z-index:2147483647;padding:12px 18px;background:#172027;color:white;border:2px solid #edca28;border-radius:8px;font:14px system-ui}#sitecms-preview-bar a{color:#edca28;margin-left:16px}';
  document.head.append(style);
  const showOverlays = () => fields().forEach(element => element.classList.toggle('sitecms-overlay', overlays));
  const apply = ({ page, key, kind, value, alt, html }) => {
    if (typeof page !== 'string' || typeof key !== 'string') return;
    for (const element of targets(page, key)) {
      if (kind === 'image') {
        const image = element instanceof HTMLImageElement ? element : element.querySelector('img');
        if (!image || typeof value !== 'string') continue;
        try {
          const url = new URL(value, location.origin);
          if (!['https:', 'http:'].includes(url.protocol)) continue;
          image.src = url.href;
          image.removeAttribute('srcset');
          image.alt = typeof alt === 'string' ? alt : '';
        } catch { /* ignore invalid image */ }
      } else if (kind === 'richtext' && typeof html === 'string') {
        element.innerHTML = html;
      } else if (typeof value === 'string') {
        element.textContent = value;
      }
    }
    lockForms();
    showOverlays();
  };
  async function refresh() {
    const current = ++generation;
    try {
      const response = await fetch('/api/sitecms/content', { cache: 'no-store', credentials: 'same-origin' });
      const data = await response.json();
      if (current !== generation || !response.ok || data.preview !== true) return;
      if (!['https://sitecms.se', 'https://www.sitecms.se', 'https://sitecms-zeta.vercel.app'].includes(data.panelOrigin)) return;
      panelOrigin = data.panelOrigin;
      for (const page of data.content.pages || []) for (const block of page.blocks || []) {
        apply({ page: page.slug, key: block.key, kind: block.type, value: block.value, alt: block.alt, html: block.html });
      }
      const seoSlug = location.pathname === '/' ? 'home' : location.pathname.startsWith('/om-anton') ? 'about' : location.pathname.split('/').filter(Boolean).at(-1);
      const meta = data.content.seo?.find(item => item.pageSlug === seoSlug);
      if (meta?.title) document.title = meta.title;
      if (meta?.description) document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
      const unique = new Map(fields().map(element => [element.getAttribute('data-sitecms'), identity(element)]));
      send('ready', { path: location.pathname, title: document.title, fields: [...unique.values()] });
      send('refreshed', { path: location.pathname });
    } catch { /* preview failure never affects published content */ }
  }
  window.addEventListener('message', event => {
    if (!panelOrigin || event.origin !== panelOrigin || event.source !== window.parent) return;
    const data = event.data;
    if (!data || data.source !== 'sitecms' || data.v !== 1) return;
    if (data.type === 'refresh') void refresh();
    else if (data.type === 'patch') apply(data);
    else if (data.type === 'overlays' && typeof data.enabled === 'boolean') { overlays = data.enabled; showOverlays(); }
    else if (data.type === 'highlight') {
      const matching = targets(data.page, data.key);
      matching[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      for (const element of matching) {
        element.classList.remove('sitecms-flash');
        void element.offsetWidth;
        element.classList.add('sitecms-flash');
      }
    }
  });
  document.addEventListener('click', event => {
    const element = event.target instanceof Element ? event.target.closest('[data-sitecms]') : null;
    if (!element || !panelOrigin) return;
    event.preventDefault(); event.stopImmediatePropagation();
    send('focus', identity(element));
  }, true);
  if (!framed) {
    const bar = document.createElement('div');
    bar.id = 'sitecms-preview-bar';
    bar.append(document.createTextNode('Förhandsgranskning'));
    const exit = document.createElement('a');
    exit.textContent = 'Avsluta';
    exit.href = `/api/sitecms/preview?disable=1&path=${encodeURIComponent(location.pathname)}`;
    bar.append(exit); document.body.append(bar);
  }
  void refresh();
})();
