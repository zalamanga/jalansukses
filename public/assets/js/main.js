(() => {
  'use strict';

  const menu = document.getElementById('nav-menu');
  const toggle = document.getElementById('nav-toggle');
  const navigation = document.querySelector('.nav');
  const desktop = window.matchMedia('(min-width: 1280px)');
  const dropdowns = [...document.querySelectorAll('.dropdown__item')];

  const setDropdown = (item, open) => {
    const button = item.querySelector('.dropdown__button');
    const panel = item.querySelector('.dropdown__container');
    if (!button || !panel) return;
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    item.classList.toggle('show-dropdown', open);
  };

  const closeDropdowns = () => dropdowns.forEach(item => setDropdown(item, false));

  const setMenu = (open) => {
    if (!menu || !toggle) return;
    const mobileOpen = open && !desktop.matches;
    menu.hidden = !desktop.matches && !mobileOpen;
    menu.classList.toggle('show-menu', mobileOpen);
    toggle.classList.toggle('show-icon', mobileOpen);
    toggle.setAttribute('aria-expanded', String(mobileOpen));
    toggle.setAttribute('aria-label', mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
    if (!mobileOpen) closeDropdowns();
  };

  if (menu && toggle) {
    setMenu(false);
    document.documentElement.classList.add('nav-ready');
    toggle.addEventListener('click', () => setMenu(menu.hidden));
    menu.addEventListener('click', event => {
      if (event.target.closest('a[href]')) setMenu(false);
    });
    desktop.addEventListener('change', () => {
      const focused = document.activeElement;
      const focusedPanel = focused?.closest('.dropdown__container');
      const dropdownButton = focusedPanel?.closest('.dropdown__item')?.querySelector('.dropdown__button');
      setMenu(false);
      if (!desktop.matches && menu.contains(focused)) toggle.focus();
      if (desktop.matches) {
        if (dropdownButton) dropdownButton.focus();
        else if (focused === toggle) menu.querySelector('a[href]')?.focus();
      }
    });
  }

  dropdowns.forEach(item => {
    const button = item.querySelector('.dropdown__button');
    const panel = item.querySelector('.dropdown__container');
    if (!button || !panel) return;
    setDropdown(item, false);
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      closeDropdowns();
      setDropdown(item, open);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openDropdown = dropdowns.find(item => item.classList.contains('show-dropdown'));
    if (openDropdown) {
      event.preventDefault();
      setDropdown(openDropdown, false);
      openDropdown.querySelector('.dropdown__button')?.focus();
    } else if (menu && !desktop.matches && !menu.hidden) {
      event.preventDefault();
      setMenu(false);
      toggle?.focus();
    }
  });

  document.addEventListener('click', event => {
    if (navigation && !navigation.contains(event.target)) setMenu(false);
  });

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  menu?.querySelectorAll('a[href]').forEach(link => {
    const active = link.getAttribute('href') === currentPage;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
    if (active && link.closest('.dropdown__item')) {
      link.closest('.dropdown__item').querySelector('.dropdown__button')?.classList.add('active');
    }
  });
  if (currentPage === 'layanan.html') menu?.querySelector('.dropdown__button')?.classList.add('active');
  if (currentPage === 'artikel.html') menu?.querySelector('a[href="berita.html"]')?.classList.add('active');

  document.querySelectorAll('form').forEach(form => {
    if (form.querySelector('fieldset[disabled]')) form.addEventListener('submit', event => event.preventDefault());
  });
})();
