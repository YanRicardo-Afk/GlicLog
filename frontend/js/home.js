/* =================================================
   GlicLog — Landing page
   Comportamentos: menu mobile, revelação ao rolar
   e pequena demo do cartão de glicemia no hero
   ================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------
     Menu mobile
  ------------------------------------------------- */
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // fecha o menu ao clicar em um link (mobile)
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* -------------------------------------------------
     Revelação suave das seções ao rolar
  ------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    '.philosophy-card, .feature-card, .a11y-item, .security-inner, .section-head'
  );

  revealTargets.forEach(el => el.classList.add('reveal'));

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach(el => observer.observe(el));
  } else {
    // sem animação: mostra tudo direto
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* -------------------------------------------------
     Demo do cartão "última medição" no hero
     (apenas ilustrativo — troque por dados reais
     quando integrar com o back-end)
  ------------------------------------------------- */
  if (!prefersReducedMotion) {
    const readings = [
      { value: 98,  label: 'Dentro da meta' },
      { value: 112, label: 'Dentro da meta' },
      { value: 145, label: 'Acima da meta' },
      { value: 104, label: 'Dentro da meta' },
    ];

    const valueEl = document.getElementById('glucose-value');
    const badgeEl = document.getElementById('glucose-badge');

    if (valueEl && badgeEl) {
      let i = 0;
      setInterval(() => {
        i = (i + 1) % readings.length;
        valueEl.style.opacity = 0;
        badgeEl.style.opacity = 0;
        setTimeout(() => {
          valueEl.textContent = readings[i].value;
          badgeEl.textContent = readings[i].label;
          valueEl.style.opacity = 1;
          badgeEl.style.opacity = 1;
        }, 250);
      }, 3200);
    }
  }

});