/* ═══════════════════════════════════════════════
   RN HERBAL – script.js
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────
     1. STICKY NAV — show after scrolling past hero
  ───────────────────────────────────────────── */
  const stickyNav = document.getElementById('stickyNav');
  const hero      = document.querySelector('.hero');

  const navObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        stickyNav.classList.add('visible');
      } else {
        stickyNav.classList.remove('visible');
      }
    },
    { threshold: 0.05 }
  );

  if (hero) navObserver.observe(hero);


  /* ─────────────────────────────────────────────
     2. VIDEO SLIDER
  ───────────────────────────────────────────── */
  const track      = document.getElementById('videoTrack');
  const arrowLeft  = document.getElementById('arrowLeft');
  const arrowRight = document.getElementById('arrowRight');
  const dotsWrap   = document.getElementById('sliderDots');

  if (track && arrowLeft && arrowRight) {
    const slides    = Array.from(track.querySelectorAll('.video-slide'));
    const total     = slides.length;
    let   current   = 1; // start at center (index 1 is active-slide)

    // Build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i === current ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    function updateDots() {
      const dots = dotsWrap.querySelectorAll('.dot');
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function updateSlides() {
      slides.forEach((s, i) => {
        s.classList.remove('active-slide');
        const thumb = s.querySelector('.video-thumb');
        if (thumb) thumb.classList.remove('featured-thumb');
        if (i === current) {
          s.classList.add('active-slide');
          if (thumb) thumb.classList.add('featured-thumb');
        }
      });
    }

    function getOffset() {
      // How many slides to shift so the active one is centred
      const containerW = track.parentElement.offsetWidth;
      const activeW    = slides[current]
        ? slides[current].getBoundingClientRect().width || 240
        : 240;
      const gap = 24;

      // Sum widths of slides before current
      let offset = 0;
      for (let i = 0; i < current; i++) {
        const w = slides[i] ? (slides[i].getBoundingClientRect().width || 200) : 200;
        offset += w + gap;
      }

      // Shift so active slide centre aligns with container centre
      offset -= (containerW / 2) - (activeW / 2);
      return Math.max(0, offset);
    }

    function goTo(index) {
      current = Math.max(0, Math.min(total - 1, index));
      track.style.transform = `translateX(-${getOffset()}px)`;
      updateSlides();
      updateDots();
    }

    arrowLeft.addEventListener('click',  () => goTo(current - 1));
    arrowRight.addEventListener('click', () => goTo(current + 1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  goTo(current - 1);
      if (e.key === 'ArrowRight') goTo(current + 1);
    });

    // Touch / swipe
    let touchStartX = 0;
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? goTo(current + 1) : goTo(current - 1);
      }
    }, { passive: true });

    // Initial position after fonts/layout settle
    window.addEventListener('load', () => goTo(current));
    window.addEventListener('resize', () => goTo(current));

    // Auto-advance every 5s
    let autoSlide = setInterval(() => goTo((current + 1) % total), 5000);

    [arrowLeft, arrowRight].forEach(btn => {
      btn.addEventListener('click', () => {
        clearInterval(autoSlide);
        autoSlide = setInterval(() => goTo((current + 1) % total), 5000);
      });
    });
  }


  /* ─────────────────────────────────────────────
     3. SCROLL ANIMATIONS — fade-in on scroll
  ───────────────────────────────────────────── */
  const animElems = document.querySelectorAll(
    '.product-card, .why-card, .review-card, .pricing-card, .why-section, .final-cta'
  );

  const styleSheet = document.styleSheets[0];
  try {
    styleSheet.insertRule(`
      .anim-hidden {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
    `, styleSheet.cssRules.length);
    styleSheet.insertRule(`
      .anim-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
    `, styleSheet.cssRules.length);
  } catch (e) { /* ignore */ }

  animElems.forEach((el, i) => {
    el.classList.add('anim-hidden');
    el.style.transitionDelay = `${(i % 3) * 0.1}s`;
  });

  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('anim-visible');
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  animElems.forEach(el => scrollObserver.observe(el));


  /* ─────────────────────────────────────────────
     4. SMOOTH SCROLL for anchor links
  ───────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = stickyNav ? stickyNav.offsetHeight + 10 : 10;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  /* ─────────────────────────────────────────────
     5. COUNTDOWN TIMER — urgency for pricing
  ───────────────────────────────────────────── */
  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    // Set timer to 12 hours from page load
    let endTime = Date.now() + 12 * 60 * 60 * 1000;

    function updateCountdown() {
      const remaining = Math.max(0, endTime - Date.now());
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      countdownEl.textContent =
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (remaining > 0) requestAnimationFrame(updateCountdown);
    }
    updateCountdown();
  }


  /* ─────────────────────────────────────────────
     6. ACTIVE NAV LINK highlight on scroll
  ───────────────────────────────────────────── */
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.sticky-nav a[href^="#"]');

  const activeSectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => activeSectionObserver.observe(s));


  /* ─────────────────────────────────────────────
     7. LOGO FALLBACK — if logo.png not found
        show text fallback gracefully
  ───────────────────────────────────────────── */
  document.querySelectorAll('img[alt*="RN Herbal"], img[alt*="Logo"]').forEach(img => {
    img.addEventListener('error', function () {
      // Replace broken img with styled text badge
      const badge = document.createElement('div');
      badge.textContent = 'RN Herbal';
      badge.style.cssText = `
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: 1.3rem;
        color: #3dbf77;
        text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        padding: 4px 0;
        white-space: nowrap;
      `;
      this.parentNode.replaceChild(badge, this);
    });
  });

});      const remaining = Math.max(0, endTime - Date.now());
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      countdownEl.textContent =
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (remaining > 0) requestAnimationFrame(updateCountdown);
    }
    updateCountdown();
  }


  /* ─────────────────────────────────────────────
     6. ACTIVE NAV LINK highlight on scroll
  ───────────────────────────────────────────── */
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.sticky-nav a[href^="#"]');

  const activeSectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => activeSectionObserver.observe(s));


  /* ─────────────────────────────────────────────
     7. LOGO FALLBACK — if logo.png not found
        show text fallback gracefully
  ───────────────────────────────────────────── */
  document.querySelectorAll('img[alt*="RN Herbal"], img[alt*="Logo"]').forEach(img => {
    img.addEventListener('error', function () {
      // Replace broken img with styled text badge
      const badge = document.createElement('div');
      badge.textContent = 'RN Herbal';
      badge.style.cssText = `
        font-family: 'Playfair Display', serif;
        font-weight: 900;
        font-size: 1.3rem;
        color: #3dbf77;
        text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        padding: 4px 0;
        white-space: nowrap;
      `;
      this.parentNode.replaceChild(badge, this);
    });
  });

});
