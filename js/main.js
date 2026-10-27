/**
 * KAKI EQ - Main Application Scripts
 * Theme switcher, hero preview switcher, lightbox gallery, FAQ accordion,
 * copy-hash, and scroll animations.
 */

(function () {
  'use strict';

  // State
  let currentTheme = localStorage.getItem('kaki-theme') || 'dark';

  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const navbar = document.querySelector('.navbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-drawer-link');
  const copyHashBtn = document.getElementById('btnCopyHash');
  const heroMainImg = document.getElementById('heroMainImg');
  const heroViewTabs = document.querySelectorAll('.view-tab-btn');
  const faqItems = document.querySelectorAll('.faq-item');
  const backToTopBtn = document.getElementById('btnBackToTop');

  // Gallery & Lightbox Elements
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryCards = document.querySelectorAll('.gallery-card');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('lightboxNextBtn');

  let currentGalleryIndex = 0;
  let visibleGalleryItems = [];

  /**
   * Initialize application features
   */
  function init() {
    setupTheme();
    setupNavbarScroll();
    setupMobileMenu();
    setupHeroViewTabs();
    setupGalleryLightbox();
    setupFaqAccordion();
    setupCopyHash();
    setupBackToTop();
    setupScrollSpy();
  }

  /**
   * Theme switcher with smooth transitions
   */
  function setupTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('kaki-theme', currentTheme);
      });
    }
  }

  /**
   * Navbar blur & elevation change on scroll
   */
  function setupNavbarScroll() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /**
   * Mobile menu drawer toggle
   */
  function setupMobileMenu() {
    if (!mobileMenuBtn || !mobileDrawer) return;

    mobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
      const isOpen = mobileDrawer.classList.contains('open');
      mobileMenuBtn.innerHTML = isOpen
        ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
    });

    // Close on clicking a link
    const drawerLinks = mobileDrawer.querySelectorAll('a');
    drawerLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      });
    });
  }

  /**
   * Hero preview window view switcher tabs (Inicio, Ecualizador, Mini-Player, Letras)
   */
  function setupHeroViewTabs() {
    if (!heroViewTabs.length || !heroMainImg) return;

    const viewImages = {
      inicio: 'assets/screenshots/Home.png',
      ecualizador: 'assets/screenshots/Equalizer.png',
      miniplayer: 'assets/screenshots/Mini-player_1.png',
      nowplaying: 'assets/screenshots/NowPlaying.png?v=2'
    };

    heroViewTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view');
        if (!viewImages[view]) return;

        heroViewTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        // Smooth image switch with fade
        heroMainImg.style.opacity = '0';
        setTimeout(() => {
          heroMainImg.src = viewImages[view];
          heroMainImg.style.opacity = '1';
        }, 150);
      });
    });
  }

  /**
   * Screenshot Gallery Filter & Lightbox Modal
   */
  function setupGalleryLightbox() {
    visibleGalleryItems = Array.from(galleryCards);

    // Filtering tabs
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');

        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        visibleGalleryItems = [];
        galleryCards.forEach((card) => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = 'block';
            visibleGalleryItems.push(card);
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // Open lightbox on card click
    galleryCards.forEach((card) => {
      card.addEventListener('click', () => {
        const index = visibleGalleryItems.indexOf(card);
        if (index !== -1) {
          openLightbox(index);
        }
      });
    });

    // Close lightbox
    if (lightboxCloseBtn) {
      lightboxCloseBtn.addEventListener('click', closeLightbox);
    }

    if (lightboxModal) {
      lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
          closeLightbox();
        }
      });
    }

    // Previous / Next buttons
    if (lightboxPrevBtn) {
      lightboxPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
      });
    }

    if (lightboxNextBtn) {
      lightboxNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
      });
    }

    // Keyboard support (Escape, Left, Right)
    window.addEventListener('keydown', (e) => {
      if (!lightboxModal || !lightboxModal.classList.contains('open')) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        navigateLightbox(1);
      }
    });
  }

  function openLightbox(index) {
    if (!lightboxModal || !visibleGalleryItems[index]) return;
    currentGalleryIndex = index;
    updateLightboxContent();
    lightboxModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    if (visibleGalleryItems.length === 0) return;
    currentGalleryIndex = (currentGalleryIndex + direction + visibleGalleryItems.length) % visibleGalleryItems.length;
    updateLightboxContent();
  }

  function updateLightboxContent() {
    const item = visibleGalleryItems[currentGalleryIndex];
    if (!item) return;

    const img = item.querySelector('img');
    const title = item.querySelector('.gallery-card-title')?.textContent || '';
    const desc = item.querySelector('.gallery-card-desc')?.textContent || '';

    if (lightboxImg && img) {
      lightboxImg.src = img.src;
      lightboxImg.alt = title;
    }

    if (lightboxCaption) {
      lightboxCaption.innerHTML = `<strong>${title}</strong> — ${desc} (${currentGalleryIndex + 1} / ${visibleGalleryItems.length})`;
    }
  }

  /**
   * FAQ Accordion expand / collapse
   */
  function setupFaqAccordion() {
    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close other items
        faqItems.forEach((other) => {
          if (other !== item) other.classList.remove('open');
        });

        if (!isOpen) {
          item.classList.add('open');
        } else {
          item.classList.remove('open');
        }
      });
    });
  }

  /**
   * Copy SHA-256 Checksum to Clipboard with feedback
   */
  function setupCopyHash() {
    if (!copyHashBtn) return;

    copyHashBtn.addEventListener('click', () => {
      const hashCode = document.getElementById('sha256Code')?.textContent?.trim() || '';
      if (!hashCode) return;

      navigator.clipboard.writeText(hashCode).then(() => {
        const originalText = copyHashBtn.innerHTML;
        copyHashBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          ¡Copiado!
        `;
        copyHashBtn.style.background = 'var(--accent-primary)';
        copyHashBtn.style.color = '#121212';

        setTimeout(() => {
          copyHashBtn.innerHTML = originalText;
          copyHashBtn.style.background = '';
          copyHashBtn.style.color = '';
        }, 2200);
      });
    });
  }

  /**
   * Back to top button smooth scroll
   */
  function setupBackToTop() {
    if (!backToTopBtn) return;
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * ScrollSpy: active link highlight on scrolling
   */
  function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset + 120;

      sections.forEach((current) => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop;
        const sectionId = current.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          document.querySelectorAll(`.nav-link[href*="${sectionId}"]`).forEach((link) => {
            link.classList.add('active');
          });
        } else {
          document.querySelectorAll(`.nav-link[href*="${sectionId}"]`).forEach((link) => {
            link.classList.remove('active');
          });
        }
      });
    }, { passive: true });
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
