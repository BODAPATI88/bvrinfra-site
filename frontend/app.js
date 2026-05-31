/* ============================================================
   BVRINFRA — app.js
   - SPA tab navigation (no page reloads)
   - Animated counters with IntersectionObserver
   - Mobile menu toggle
   - Architecture diagram lightbox
   - Evidence card placeholder fallbacks
   No frameworks. No build tools.
   ============================================================ */

(function () {
  'use strict';

  /* ── Page router ───────────────────────────────────────────── */
  const pages = {
    overview:     document.getElementById('page-overview'),
    projects:     document.getElementById('page-projects'),
    architecture: document.getElementById('page-architecture'),
    resume:       document.getElementById('page-resume'),
    contact:      document.getElementById('page-contact'),
  };

  const allTabs = document.querySelectorAll('.nav-tab');
  let currentPage = 'overview';

  function showPage(name) {
    if (!pages[name]) return;
    currentPage = name;

    /* Hide all pages */
    Object.values(pages).forEach(function (p) {
      if (p) p.classList.remove('active');
    });

    /* Show target */
    pages[name].classList.add('active');

    /* Update tab active state + aria-selected */
    allTabs.forEach(function (tab) {
      const isActive = tab.dataset.page === name;
      tab.classList.toggle('active', isActive);
      if (tab.hasAttribute('aria-selected')) {
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    });

    /* Scroll to top of content */
    window.scrollTo({ top: 0, behavior: 'smooth' });

    /* Trigger counters if switching to overview */
    if (name === 'overview') {
      setTimeout(initCounters, 100);
    }

    /* Close mobile drawer */
    closeMobileMenu();
  }

  /* Attach click listeners to ALL tab buttons (nav + mobile drawer + hero CTAs) */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-page]');
    if (btn) {
      e.preventDefault();
      showPage(btn.dataset.page);
    }
  });

  /* ── Mobile menu ───────────────────────────────────────────── */
  const menuBtn      = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');

  function closeMobileMenu() {
    if (!mobileDrawer || !menuBtn) return;
    mobileDrawer.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
  }

  function openMobileMenu() {
    if (!mobileDrawer || !menuBtn) return;
    mobileDrawer.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
  }

  if (menuBtn && mobileDrawer) {
    menuBtn.addEventListener('click', function () {
      if (mobileDrawer.classList.contains('open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  /* ── Animated Counters ─────────────────────────────────────── */
  const statCells    = document.querySelectorAll('.stat-cell');
  const countersDone = new WeakSet();

  function animateCounter(cell) {
    if (countersDone.has(cell)) return;
    countersDone.add(cell);

    const target  = parseInt(cell.dataset.count, 10);
    const display = cell.querySelector('.stat-val');
    if (!display || isNaN(target)) return;

    const steps   = 40;
    const stepVal = target / steps;
    const delay   = 30; /* ms per tick */
    let current   = 0;
    let tick      = 0;

    const id = setInterval(function () {
      tick++;
      current = tick >= steps ? target : Math.floor(stepVal * tick);
      display.textContent = current;
      if (tick >= steps) clearInterval(id);
    }, delay);
  }

  function initCounters() {
    if (!('IntersectionObserver' in window)) {
      /* Fallback: set final values immediately */
      statCells.forEach(function (cell) {
        const val = cell.querySelector('.stat-val');
        if (val) val.textContent = cell.dataset.count;
      });
      return;
    }

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) animateCounter(entry.target);
      });
    }, { threshold: 0.5 });

    statCells.forEach(function (cell) { obs.observe(cell); });
  }

  /* ── Architecture Lightbox ─────────────────────────────────── */
  const archModal     = document.getElementById('arch-modal');
  const archClose     = document.getElementById('arch-modal-close');
  const archBackdrop  = document.getElementById('arch-modal-backdrop');
  const archImgWrap   = document.getElementById('arch-img-wrap');
  const archOverlay   = document.getElementById('arch-img-overlay');
  const archExpandBtn = document.getElementById('arch-expand-btn');
  let modalOpen = false;

  function openModal() {
    if (!archModal) return;
    archModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalOpen = true;
    /* Move focus to close button for accessibility */
    if (archClose) archClose.focus();
    /* Scroll modal image area to top */
    const scroll = archModal.querySelector('.arch-modal-scroll');
    if (scroll) scroll.scrollTop = 0;
  }

  function closeModal() {
    if (!archModal) return;
    archModal.classList.remove('open');
    document.body.style.overflow = '';
    modalOpen = false;
    /* Return focus to expand button */
    if (archExpandBtn) archExpandBtn.focus();
  }

  if (archImgWrap)   archImgWrap.addEventListener('click',   openModal);
  if (archOverlay)   archOverlay.addEventListener('click',   openModal);
  if (archExpandBtn) archExpandBtn.addEventListener('click', openModal);
  if (archClose)     archClose.addEventListener('click',     closeModal);
  if (archBackdrop)  archBackdrop.addEventListener('click',  closeModal);

  /* Keyboard: Enter/Space on overlay (role=button + tabindex=0) */
  if (archOverlay) {
    archOverlay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal();
      }
    });
  }

  /* Global Escape to close modal */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOpen) closeModal();
  });

  /* ── Evidence card placeholders ───────────────────────────── */
  function initEvidencePlaceholders() {
    document.querySelectorAll('.evidence-img').forEach(function (img) {
      var placeholder = img.nextElementSibling;
      if (!placeholder || !placeholder.classList.contains('evidence-placeholder')) return;

      /* Initially hide placeholder, show img — placeholder is CSS-shown by default */
      img.style.display = 'block';
      placeholder.style.display = 'none';

      img.addEventListener('error', function () {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
      });
    });
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    /* Show default page */
    showPage('overview');

    /* Start counter animation */
    initCounters();

    /* Init evidence placeholder fallbacks */
    initEvidencePlaceholders();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
