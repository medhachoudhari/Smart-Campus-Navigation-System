/* ============================================================
   CampusSense AI — Global Application Script
   Handles navigation, dark mode, scroll animations
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initDarkMode();
  initScrollAnimations();
  highlightActiveNav();
});

/* ---------- Mobile Navigation Toggle ---------- */
function initNavigation() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', (!expanded).toString());
      menu.classList.toggle('open');

      // Animate hamburger
      const hamburger = toggle.querySelector('.hamburger');
      if (hamburger) {
        hamburger.style.transform = expanded ? '' : 'rotate(45deg)';
      }
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ---------- Dark / Light Mode Toggle ---------- */
function initDarkMode() {
  const toggle = document.getElementById('dark-mode-toggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('campussense_theme');

  if (saved === 'light') {
    root.classList.add('light');
    if (toggle) toggle.checked = true;
  }

  if (toggle) {
    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        root.classList.add('light');
        localStorage.setItem('campussense_theme', 'light');
      } else {
        root.classList.remove('light');
        localStorage.setItem('campussense_theme', 'dark');
      }
    });
  }
}

/* ---------- Scroll-based Fade-in Animations ---------- */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ---------- Highlight Active Nav Link ---------- */
function highlightActiveNav() {
  const path = window.location.pathname;
  const links = document.querySelectorAll('.nav-menu a');

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (
      (path === '/' && (href === '/' || href === '/index.html')) ||
      (path.includes('campus-map') && href.includes('campus-map')) ||
      (path.includes('about') && href.includes('about')) ||
      (path.includes('assistant') && href.includes('assistant'))
    ) {
      link.classList.add('active');
    }
  });
}
