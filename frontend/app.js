/* ============================================================
   BVRINFRA — app.js
   - SPA tab navigation
   - Animated counters (IntersectionObserver)
   - Mobile menu toggle with aria-expanded
   - Architecture diagram lightbox
   - Evidence card lightbox
   - Evidence placeholder fallbacks
   No frameworks. No build tools.
   ============================================================ */

(function () {
  'use strict';

  /* ── Page router ───────────────────────────────────────────── */
  var pages = {
    overview:     document.getElementById('page-overview'),
    projects:     document.getElementById('page-projects'),
    architecture: document.getElementById('page-architecture'),
    resume:       document.getElementById('page-resume'),
    contact:      document.getElementById('page-contact'),
  };

  var allTabs = document.querySelectorAll('.nav-tab');
  var currentPage = 'overview';

  function showPage(name) {
    if (!pages[name]) return;
    currentPage = name;

    Object.keys(pages).forEach(function (key) {
      if (pages[key]) pages[key].classList.remove('active');
    });
    pages[name].classList.add('active');

    allTabs.forEach(function (tab) {
      var isActive = tab.dataset.page === name;
      tab.classList.toggle('active', isActive);
      if (tab.hasAttribute('aria-selected')) {
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (name === 'overview') {
      setTimeout(initCounters, 100);
    }

    closeMobileMenu();
  }

  /* Delegate all data-page clicks (nav tabs + hero CTAs + any future buttons) */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-page]');
    if (btn) {
      e.preventDefault();
      showPage(btn.dataset.page);
    }
  });

  /* ── Mobile menu ───────────────────────────────────────────── */
  var menuBtn      = document.getElementById('mobile-menu-btn');
  var mobileDrawer = document.getElementById('mobile-drawer');

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
  var statCells    = document.querySelectorAll('.stat-cell');
  var countersDone = new WeakSet();

  function animateCounter(cell) {
    if (countersDone.has(cell)) return;
    countersDone.add(cell);

    var target  = parseInt(cell.dataset.count, 10);
    var display = cell.querySelector('.stat-val');
    if (!display || isNaN(target)) return;

    var steps   = 40;
    var stepVal = target / steps;
    var delay   = 30;
    var current = 0;
    var tick    = 0;

    var id = setInterval(function () {
      tick++;
      current = tick >= steps ? target : Math.floor(stepVal * tick);
      display.textContent = current;
      if (tick >= steps) clearInterval(id);
    }, delay);
  }

  function initCounters() {
    if (!('IntersectionObserver' in window)) {
      statCells.forEach(function (cell) {
        var val = cell.querySelector('.stat-val');
        if (val) val.textContent = cell.dataset.count;
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) animateCounter(entry.target);
      });
    }, { threshold: 0.5 });
    statCells.forEach(function (cell) { obs.observe(cell); });
  }

  /* ── Architecture Lightbox ─────────────────────────────────── */
  var archModal     = document.getElementById('arch-modal');
  var archClose     = document.getElementById('arch-modal-close');
  var archBackdrop  = document.getElementById('arch-modal-backdrop');
  var archImgWrap   = document.getElementById('arch-img-wrap');
  var archOverlay   = document.getElementById('arch-img-overlay');
  var archExpandBtn = document.getElementById('arch-expand-btn');
  var archModalOpen = false;

  function openArchModal() {
    if (!archModal) return;
    archModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    archModalOpen = true;
    var scroll = archModal.querySelector('.arch-modal-scroll');
    if (scroll) scroll.scrollTop = 0;
    if (archClose) archClose.focus();
  }

  function closeArchModal() {
    if (!archModal) return;
    archModal.classList.remove('open');
    document.body.style.overflow = '';
    archModalOpen = false;
    if (archExpandBtn) archExpandBtn.focus();
  }

  if (archImgWrap)   archImgWrap.addEventListener('click',   openArchModal);
  if (archOverlay)   archOverlay.addEventListener('click',   openArchModal);
  if (archExpandBtn) archExpandBtn.addEventListener('click', openArchModal);
  if (archClose)     archClose.addEventListener('click',     closeArchModal);
  if (archBackdrop)  archBackdrop.addEventListener('click',  closeArchModal);

  if (archOverlay) {
    archOverlay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openArchModal(); }
    });
  }

  /* ── Evidence Lightbox ─────────────────────────────────────── */
  var evidenceModal        = document.getElementById('evidence-modal');
  var evidenceModalClose   = document.getElementById('evidence-modal-close');
  var evidenceModalBackdrop = document.getElementById('evidence-modal-backdrop');
  var evidenceModalImg     = document.getElementById('evidence-modal-img');
  var evidenceModalOpen    = false;
  var lastFocusedEvidence  = null;

  function openEvidenceModal(src, alt, triggerEl) {
    if (!evidenceModal || !evidenceModalImg) return;
    evidenceModalImg.src = src || '';
    evidenceModalImg.alt = alt || '';
    evidenceModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    evidenceModalOpen = true;
    lastFocusedEvidence = triggerEl || null;
    var scroll = evidenceModal.querySelector('.arch-modal-scroll');
    if (scroll) scroll.scrollTop = 0;
    if (evidenceModalClose) evidenceModalClose.focus();
  }

  function closeEvidenceModal() {
    if (!evidenceModal) return;
    evidenceModal.classList.remove('open');
    document.body.style.overflow = '';
    evidenceModalOpen = false;
    if (lastFocusedEvidence) lastFocusedEvidence.focus();
  }

  if (evidenceModalClose)   evidenceModalClose.addEventListener('click',   closeEvidenceModal);
  if (evidenceModalBackdrop) evidenceModalBackdrop.addEventListener('click', closeEvidenceModal);

  /* Delegate clicks on evidence cards */
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.evidence-card[data-evidence-src]');
    if (card) {
      e.preventDefault();
      openEvidenceModal(card.dataset.evidenceSrc, card.dataset.evidenceAlt, card);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      var card = document.activeElement && document.activeElement.closest('.evidence-card[data-evidence-src]');
      if (card) {
        e.preventDefault();
        openEvidenceModal(card.dataset.evidenceSrc, card.dataset.evidenceAlt, card);
      }
    }
  });

  /* ── Global Escape ─────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (archModalOpen)     closeArchModal();
      if (evidenceModalOpen) closeEvidenceModal();
    }
  });

  /* ── Evidence placeholder fallbacks ───────────────────────── */
  function initEvidencePlaceholders() {
    document.querySelectorAll('.evidence-img').forEach(function (img) {
      var placeholder = img.nextElementSibling;
      if (!placeholder || !placeholder.classList.contains('evidence-placeholder')) return;
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
    showPage('overview');
    initCounters();
    initEvidencePlaceholders();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
