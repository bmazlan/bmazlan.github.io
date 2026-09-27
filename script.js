(() => {
  const root = document.documentElement;
  const themeButtons = document.querySelectorAll('.theme-toggle');
  const storedTheme = localStorage.getItem('bm-theme');
  root.dataset.theme = storedTheme === 'light' ? 'light' : 'dark';

  const syncThemeButtons = () => {
    const light = root.dataset.theme === 'light';
    themeButtons.forEach(btn => {
      btn.setAttribute('aria-pressed', String(light));
      btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    });
  };
  syncThemeButtons();
  themeButtons.forEach(btn => btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('bm-theme', root.dataset.theme);
    syncThemeButtons();
  }));

  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const button = form?.querySelector('.submit-button');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const progress = document.querySelector('.scroll-progress span');
  const cursorGlow = document.querySelector('.cursor-glow');
  const tilt = document.querySelector('[data-tilt]');
  const graphPath = document.getElementById('live-graph-path');
  const graphValue = document.getElementById('graph-live-value');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  menuButton?.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    mobileNav.setAttribute('aria-hidden', String(!open));
  });
  mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
  }));

  let raf = 0;
  let pointerX = -999, pointerY = -999;
  const updateFrame = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    if (cursorGlow && pointerX > -900) {
      cursorGlow.style.opacity = '1';
      cursorGlow.style.transform = `translate3d(${pointerX}px,${pointerY}px,0) translate3d(-50%,-50%,0)`;
    }
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(updateFrame); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pointermove', e => { pointerX = e.clientX; pointerY = e.clientY; schedule(); }, { passive: true });

  if (!reduceMotion && tilt && window.matchMedia('(pointer:fine)').matches) {
    let tiltRaf = 0, tx = 0, ty = 0;
    tilt.addEventListener('pointermove', e => {
      const r = tilt.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * 7;
      ty = ((e.clientY - r.top) / r.height - .5) * -6;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(() => {
        tiltRaf = 0;
        tilt.querySelector('.system-card')?.style.setProperty('transform', `rotateX(${ty}deg) rotateY(${tx}deg) translateY(-4px)`);
      });
    });
    tilt.addEventListener('pointerleave', () => {
      tilt.querySelector('.system-card')?.style.setProperty('transform', 'rotateX(5deg) rotateY(-7deg)');
    });
  }

  // Keeps the hero graph alive forever. Data changes continuously instead of replaying a fixed animation.
  const points = 24;
  let values = Array.from({ length: points }, (_, i) => 95 + Math.sin(i * .7) * 18 + Math.random() * 18);
  const makePath = () => {
    const coords = values.map((v, i) => [i * (420 / (points - 1)), 160 - v]);
    let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
    for (let i = 1; i < coords.length; i++) {
      const [x, y] = coords[i];
      const [px, py] = coords[i - 1];
      const cx = (px + x) / 2;
      d += ` C ${cx.toFixed(1)} ${py.toFixed(1)}, ${cx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };
  const tickGraph = () => {
    values.shift();
    const last = values[values.length - 1];
    const next = Math.max(35, Math.min(145, last + (Math.random() - .46) * 34));
    values.push(next);
    if (graphPath) graphPath.setAttribute('d', makePath());
    if (graphValue) graphValue.textContent = `${Math.round(3200 + next * 18 + Math.random() * 650).toLocaleString()} req/s`;
  };
  tickGraph();
  setInterval(tickGraph, reduceMotion ? 1800 : 700);

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot?.value) return;
    button.disabled = true;
    button.querySelector('span').textContent = 'Sending…';
    status.textContent = '';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Submission failed');
      form.reset();
      status.textContent = 'Thanks — message sent. I’ll get back to you soon.';
    } catch {
      status.textContent = 'Hmm, that didn’t go through. Try email instead — it’s right there above.';
    } finally {
      button.disabled = false;
      button.querySelector('span').textContent = 'Send message';
    }
  });
})();
