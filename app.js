(() => {
  'use strict';

  const CONFIG = window.CONNECT_SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const STEPS = {
    windows: [
      { exit: 'Saída 1', title: 'Baixe o instalador', text: 'Clique em <b>Baixar</b>. O arquivo é o <code>Connect.Friends-win-Setup.exe</code>.' },
      { exit: 'Saída 2', title: 'Abra e instale', text: 'Dê dois cliques no arquivo. Se o Windows mostrar um aviso azul, clique em <b>Mais informações → Executar assim mesmo</b>.' },
      { exit: 'Saída 3', title: 'Entre com sua conta', text: 'Depois disso não precisa voltar aqui: quando sair versão nova, o Connect se atualiza sozinho.' },
    ],
    android: [
      { exit: 'Saída 1', title: 'Baixe o APK no celular', text: 'Abra esta página no próprio celular e toque em <b>Baixar</b>.' },
      { exit: 'Saída 2', title: 'Autorize a instalação', text: 'Abra o APK. Se o Android pedir, permita <b>só esse app</b> instalar. Não precisa mexer em mais nada.' },
      { exit: 'Saída 3', title: 'Entre com sua conta', text: 'É a mesma conta do PC. Pra atualizar, instale a versão nova por cima, sem desinstalar.' },
    ],
  };

  const release = {
    live: false,
    version: CONFIG.fallbackVersion,
    notesUrl: CONFIG.releasesPage,
    assets: {},
  };

  function fallbackAssets(version) {
    const out = {};
    for (const [key, p] of Object.entries(CONFIG.platforms)) {
      out[key] = { url: p.fallbackUrl, file: p.fallbackFile.replace('{version}', version), size: null };
    }
    return out;
  }

  async function loadRelease() {
    release.assets = fallbackAssets(release.version);
    if (!CONFIG.live) return;

    try {
      const res = await fetch(`https://api.github.com/repos/${CONFIG.repository}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) throw new Error(`GitHub respondeu ${res.status}`);
      const data = await res.json();

      release.live = true;
      release.version = String(data.tag_name || '').replace(/^v/i, '') || release.version;
      release.notesUrl = data.html_url || release.notesUrl;
      release.assets = fallbackAssets(release.version);

      for (const [key, p] of Object.entries(CONFIG.platforms)) {
        const re = new RegExp(p.assetPattern);
        const asset = (data.assets || []).find((a) => re.test(a.name));
        if (asset) release.assets[key] = { url: asset.browser_download_url, file: asset.name, size: asset.size };
      }
    } catch (err) {
      console.warn('[Connect] Não deu para ler a última release; usando links de reserva.', err);
      release.live = true;
    }
  }

  function formatSize(bytes) {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(mb >= 100 ? 0 : 1).replace('.', ',')} MB`;
  }

  const detected = /android/i.test(navigator.userAgent) ? 'android' : 'windows';
  let current = null;

  const needle = $('[data-needle]');
  const lcd = $('[data-lcd]');
  const freqEl = $('[data-freq]');
  const ticket = $('[data-ticket]');
  const knob = $('[data-knob]');
  let knobTurns = 0;

  function stationFraction(freq) {
    return Math.min(1, Math.max(0, (parseFloat(freq) - 88) / 20));
  }

  function animateFreq(from, to) {
    if (reduceMotion || from === to) { freqEl.textContent = to.toFixed(1); return; }
    const start = performance.now();
    const dur = 700;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      freqEl.textContent = (from + (to - from) * eased).toFixed(1);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setPlatform(key, { fromUser = false } = {}) {
    if (key === current) return;
    const prev = current;
    current = key;
    const p = CONFIG.platforms[key];
    const asset = release.assets[key];

    $$('.preset').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.platform === key)));

    needle.style.left = `calc(16px + (100% - 32px) * ${stationFraction(p.station)})`;
    animateFreq(prev ? parseFloat(CONFIG.platforms[prev].station) : parseFloat(p.station), parseFloat(p.station));
    $('[data-lcd-text]').textContent = p.lcd;

    knobTurns += key === 'android' ? 1 : -1;
    knob.style.transform = `rotate(${knobTurns * 140}deg)`;

    if (prev) {
      lcd.classList.remove('is-tuning'); void lcd.offsetWidth; lcd.classList.add('is-tuning');
      ticket.classList.remove('is-swapping'); void ticket.offsetWidth; ticket.classList.add('is-swapping');
    }
    if (fromUser) playStatic();

    $('[data-ticket-icon] use').setAttribute('href', `#icon-${key}`);
    $('[data-platform-label]').textContent = p.label;
    $('[data-requirements]').textContent = p.requirements;
    $('[data-file]').textContent = asset.file;
    $('[data-size]').textContent = formatSize(asset.size);
    $('[data-detected]').hidden = key !== detected;
    $('[data-download]').href = release.live ? asset.url : '#';

    renderSteps(key, Boolean(prev));
  }

  function renderSteps(key, animate) {
    const list = $('[data-steps]');
    list.innerHTML = STEPS[key].map((s, i) => `
      <li class="sign${animate ? ' is-entering' : ''}" style="--i:${i * 0.1}s">
        <span class="sign__exit">${s.exit}</span>
        <div class="sign__num">${i + 1}</div>
        <h3>${s.title}</h3>
        <p>${s.text}</p>
      </li>`).join('');
    $('[data-install-sub]').textContent = `São três passos no ${CONFIG.platforms[key].label}.`;
  }

  let audioCtx;
  function playStatic() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const len = audioCtx.sampleRate * 0.35;
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.35);
      const gain = audioCtx.createGain();
      gain.gain.value = 0.05;
      src.connect(filter).connect(gain).connect(audioCtx.destination);
      src.start();
    } catch {}
  }

  const mission = $('[data-mission]');
  let lastFocus = null;

  function openMission({ kicker, title, html }) {
    $('[data-mission-kicker]').textContent = kicker;
    $('[data-mission-title]').textContent = title;
    $('[data-mission-text]').innerHTML = html;
    lastFocus = document.activeElement;
    mission.hidden = false;
    $('[data-mission-close]').focus();
  }
  function closeMission() {
    mission.hidden = true;
    if (lastFocus) lastFocus.focus();
  }
  $('[data-mission-close]').addEventListener('click', closeMission);
  mission.addEventListener('click', (e) => { if (e.target === mission) closeMission(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mission.hidden) closeMission(); });

  $('[data-download]').addEventListener('click', (e) => {
    const p = CONFIG.platforms[current];
    const asset = release.assets[current];
    if (!release.live) {
      e.preventDefault();
      openMission({
        kicker: 'Protótipo',
        title: 'Quase lá',
        html: `O download ainda não está ligado. Quando estiver, este botão baixa o <code>${asset.file}</code> da versão mais nova para ${p.label}.`,
      });
      return;
    }
    openMission({
      kicker: 'Baixando',
      title: 'Instalar o Connect',
      html: `O download do <code>${asset.file}</code> começou. Depois é só abrir o arquivo e seguir os passos aqui embaixo.`,
    });
  });

  function seeded(seed) {
    return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  function buildSkyline() {
    const svg = $('[data-skyline]');
    const W = 1600, H = 300;
    const rnd = seeded(42);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let back = '', front = '', windows = '', neon = '';

    for (let x = 0; x < W;) {
      const w = 40 + rnd() * 70, h = 60 + rnd() * 120;
      back += `<rect class="b2" x="${x}" y="${H - h}" width="${w + 1}" height="${h}"/>`;
      x += w;
    }
    for (let x = -10; x < W;) {
      const w = 34 + rnd() * 80;
      const centerDist = Math.abs(x + w / 2 - W / 2) / (W / 2);
      const h = 40 + rnd() * 150 + (1 - centerDist) * 40;
      const y = H - h;
      front += `<rect class="b" x="${x}" y="${y}" width="${w + 1}" height="${h}"/>`;

      const r = rnd();
      if (r > 0.82) {
        front += `<rect class="b" x="${x + w * 0.15}" y="${y - 18}" width="${w * 0.7}" height="20"/>`;
        front += `<rect class="b" x="${x + w * 0.32}" y="${y - 34}" width="${w * 0.36}" height="18"/>`;
        front += `<rect class="b" x="${x + w / 2 - 1.5}" y="${y - 70}" width="3" height="38"/>`;
        neon += `<rect class="${rnd() > 0.5 ? 'neon' : 'neon-p'}" x="${x + w * 0.15 + 3}" y="${y - 15}" width="${w * 0.7 - 6}" height="8" rx="2"/>`;
      } else if (r > 0.7) {
        neon += `<line class="${rnd() > 0.5 ? 'neon' : 'neon-p'}" x1="${x + 6}" y1="${y + 8}" x2="${x + w - 6}" y2="${y + 8}"/>`;
      }

      for (let wy = y + 16; wy < H - 10; wy += 13) {
        for (let wx = x + 6; wx < x + w - 8; wx += 11) {
          const on = rnd();
          if (on > 0.62) windows += `<rect class="w on${on > 0.97 ? ' blink' : ''}" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="5" height="6" style="animation-delay:${(rnd() * 5).toFixed(2)}s"/>`;
        }
      }
      x += w + (rnd() > 0.8 ? 10 : 0);
    }
    svg.innerHTML = `<g>${back}</g><g>${front}</g><g>${windows}</g><g>${neon}</g>`;
  }

  function buildEq() {
    const eq = $('[data-eq]');
    const rnd = seeded(7);
    eq.innerHTML = Array.from({ length: 20 }, () =>
      `<span style="--d:${(0.45 + rnd() * 0.7).toFixed(2)}s;--delay:-${(rnd()).toFixed(2)}s;--peak:${(0.55 + rnd() * 0.45).toFixed(2)}"></span>`
    ).join('');
  }

  function buildTicker() {
    const track = $('[data-ticker]');
    track.innerHTML += track.innerHTML;
  }

  function setupParallax() {
    if (reduceMotion) return;
    const layers = $$('[data-depth]');
    const hero = $('.hero');
    let mx = 0, my = 0, sy = 0, ticking = false;

    const apply = () => {
      ticking = false;
      for (const el of layers) {
        const d = parseFloat(el.dataset.depth);
        el.style.translate = `${(mx * d * 30).toFixed(1)}px ${(my * d * 16 + sy * d * 0.35).toFixed(1)}px`;
      }
    };
    const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };

    hero.addEventListener('pointermove', (e) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
      queue();
    });
    addEventListener('scroll', () => { sy = Math.min(scrollY, innerHeight); queue(); }, { passive: true });
  }

  function setupNav() {
    const nav = $('.nav');
    const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function setupReveal() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) { items.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      }
    }, { threshold: 0.15 });
    items.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 90}ms`; io.observe(el); });
  }

  async function init() {
    buildSkyline();
    buildEq();
    buildTicker();
    setupNav();
    setupReveal();
    setupParallax();

    $$('.preset').forEach((b) => b.addEventListener('click', () => setPlatform(b.dataset.platform, { fromUser: true })));
    knob.addEventListener('click', () => setPlatform(current === 'windows' ? 'android' : 'windows', { fromUser: true }));
    $('[data-hero-cta]').addEventListener('click', () => setPlatform(CONFIG.defaultPlatform));

    await loadRelease();

    $$('[data-version]').forEach((el) => { el.textContent = release.version; });
    $('[data-releases-link]').href = CONFIG.releasesPage;
    const badge = $('[data-mode-badge]');
    badge.textContent = release.live ? 'Ligado · última versão' : 'Protótipo · download desligado';
    badge.classList.toggle('is-live', release.live);

    setPlatform(CONFIG.defaultPlatform);
  }

  init();
})();
