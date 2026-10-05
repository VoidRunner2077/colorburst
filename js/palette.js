// colorburst — генератор палитр
(function () {
  const resultEl = document.getElementById('paletteResult');
  const metaEl = document.getElementById('paletteMeta');
  const harmonySel = document.getElementById('harmony');
  const countInput = document.getElementById('count');
  const lightInput = document.getElementById('light');
  const satInput = document.getElementById('sat');
  const countValue = document.getElementById('countValue');
  const lightValue = document.getElementById('lightValue');
  const satValue = document.getElementById('satValue');
  const darkMode = document.getElementById('darkMode');
  const softMode = document.getElementById('soft');
  const generateBtn = document.getElementById('generateBtn');
  const randomBtn = document.getElementById('randomBtn');

  if (!resultEl) return;

  // ---------- цветовые утилиты ----------
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }

  function hexToRgb(hex) {
    const m = hex.replace('#', '');
    const n = parseInt(m, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  // ---------- генерация ----------
  function makeColors(harmony, count, sat, light, dark) {
    const baseH = Math.random() * 360;
    const hues = [];

    switch (harmony) {
      case 'analogous': {
        const step = 24;
        for (let i = 0; i < count; i++) hues.push((baseH + i * step - (count - 1) * step / 2 + 720) % 360);
        break;
      }
      case 'complementary':
        for (let i = 0; i < count; i++) hues.push((baseH + i * (180 / Math.max(1, count - 1))) % 360);
        break;
      case 'triadic':
        for (let i = 0; i < count; i++) hues.push((baseH + (i % 3) * 120) % 360);
        break;
      case 'tetradic':
        for (let i = 0; i < count; i++) hues.push((baseH + (i % 4) * 90) % 360);
        break;
      case 'split': {
        const offs = [0, 150, 210];
        for (let i = 0; i < count; i++) hues.push((baseH + offs[i % 3]) % 360);
        break;
      }
      case 'monochromatic':
        for (let i = 0; i < count; i++) hues.push(baseH);
        break;
    }

    const baseLight = dark ? Math.max(15, light - 20) : light;

    return hues.map((h, i) => {
      let l = baseLight;
      if (harmony === 'monochromatic') {
        l = dark
          ? 18 + i * (45 / Math.max(1, count - 1))
          : 25 + i * (55 / Math.max(1, count - 1));
      }
      return hslToHex(h, sat, Math.round(l));
    });
  }

  function textColorFor(hex) {
    const { r, g, b } = hexToRgb(hex);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#0b0c0e' : '#ffffff';
  }

  // ---------- рендер ----------
  let currentColors = [];

  function render(colors, harmony, soft) {
    currentColors = colors;
    resultEl.innerHTML = '';
    resultEl.style.gridTemplateColumns = `repeat(${colors.length}, 1fr)`;

    colors.forEach((hex, i) => {
      const sw = document.createElement('div');
      sw.className = 'swatch';
      sw.style.background = hex;
      sw.style.color = textColorFor(hex);
      sw.style.animation = `swatchIn .35s ${i * 0.04}s both`;
      if (soft) sw.style.filter = 'saturate(.92)';

      sw.innerHTML = `
        <span class="lock">🔒</span>
        <span class="hex">${hex.toUpperCase()}</span>
      `;

      sw.addEventListener('click', () => copySwatch(sw, hex));
      resultEl.appendChild(sw);
    });

    const labels = {
      analogous: 'analogous · соседние',
      complementary: 'complementary · контраст',
      triadic: 'triadic · триада',
      tetradic: 'tetradic · четыре',
      split: 'split-complementary',
      monochromatic: 'monochromatic · один тон'
    };
    if (metaEl) metaEl.textContent = (labels[harmony] || harmony) + ' · ' + colors.length + ' цветов';
  }

  function generate() {
    const harmony = harmonySel.value;
    const count = +countInput.value;
    const light = +lightInput.value;
    const sat = +satInput.value;
    const dark = darkMode.checked;
    const soft = softMode.checked;

    const colors = makeColors(harmony, count, sat, light, dark);
    render(colors, harmony, soft);
  }

  // ---------- копирование ----------
  function copySwatch(el, hex) {
    navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
      el.classList.remove('copied');
      void el.offsetWidth;
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 800);
    }).catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = hex.toUpperCase();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      el.classList.remove('copied');
      void el.offsetWidth;
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 800);
    });
  }

  // ---------- экспорт ----------
  function buildExport(format) {
    const rgbList = currentColors.map(hexToRgb);
    const hslList = currentColors.map(c => rgbToHsl(c.r, c.g, c.b));

    switch (format) {
      case 'hex':
        return currentColors.map(c => c.toUpperCase()).join('\n');
      case 'rgb':
        return rgbList.map(c => `rgb(${c.r}, ${c.g}, ${c.b})`).join('\n');
      case 'hsl':
        return hslList.map(c => `hsl(${c.h}, ${c.s}%, ${c.l}%)`).join('\n');
      case 'css':
        return ':root {\n' + currentColors.map((c, i) => `  --color-${i + 1}: ${c.toUpperCase()};`).join('\n') + '\n}';
      case 'scss':
        return currentColors.map((c, i) => `$color-${i + 1}: ${c.toUpperCase()};`).join('\n');
      case 'json':
        return JSON.stringify(currentColors.map(c => c.toUpperCase()), null, 2);
    }
  }

  document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = buildExport(btn.dataset.format);
      if (!data) return;
      navigator.clipboard.writeText(data).then(() => {
        const old = btn.textContent;
        btn.classList.add('ok');
        btn.textContent = '✓ скопировано';
        setTimeout(() => {
          btn.classList.remove('ok');
          btn.textContent = old;
        }, 1200);
      });
    });
  });

  // ---------- синхронизация слайдеров ----------
  countInput.addEventListener('input', () => {
    countValue.textContent = countInput.value;
    generate();
  });
  lightInput.addEventListener('input', () => {
    lightValue.textContent = lightInput.value + '%';
    generate();
  });
  satInput.addEventListener('input', () => {
    satValue.textContent = satInput.value + '%';
    generate();
  });

  harmonySel.addEventListener('change', generate);
  darkMode.addEventListener('change', generate);
  softMode.addEventListener('change', generate);

  generateBtn.addEventListener('click', generate);
  randomBtn.addEventListener('click', () => {
    const opts = [...harmonySel.options];
    harmonySel.value = opts[Math.floor(Math.random() * opts.length)].value;
    countInput.value = 3 + Math.floor(Math.random() * 6);
    lightInput.value = 35 + Math.floor(Math.random() * 40);
    satInput.value = 45 + Math.floor(Math.random() * 55);
    countValue.textContent = countInput.value;
    lightValue.textContent = lightInput.value + '%';
    satValue.textContent = satInput.value + '%';
    generate();
  });

  // ---------- фон-курсор ----------
  document.addEventListener('mousemove', e => {
    document.body.style.setProperty('--mx', e.clientX + 'px');
    document.body.style.setProperty('--my', e.clientY + 'px');
  });

  // ---------- факт ----------
  const facts = [
    'В Древнем Египте синий пигмент получали, нагревая песок, медную руду и известь до 850 °C. Этот «египетский синий» оставался самым ярким синим в мире почти 3000 лет.',
    'Краплак — ярко-красный пигмент — добывали из корней марены. Чтобы получить 1 кг красителя, требовалось около 10 000 растений.',
    'Пурпур в Античности стоил дороже золота: 10 000 морских улиток давали всего 1 грамм красителя.',
    'Титановые белила появились только в 1916 году и почти мгновенно вытеснили свинцовые — они безопаснее и в 2 раза укрывистее.',
    'Ультрамарин в Средние века ценился наравне с золотом: его добывали из лазурита в Афганистане.',
    'Иоганнес Иттен впервые системно описал теорию цветовых гармоний в Баухаусе в 1920-х годах.',
    'Теорию дополнительных цветов первым сформулировал Леонардо да Винчи — задолго до Ньютона и Гёте.'
  ];
  const factEl = document.getElementById('historyFact');
  if (factEl) {
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % facts.length;
      factEl.style.transition = 'opacity .4s';
      factEl.style.opacity = 0;
      setTimeout(() => {
        factEl.textContent = facts[idx];
        factEl.style.opacity = 1;
      }, 400);
    }, 20000);
  }

  // первый запуск
  generate();
})();