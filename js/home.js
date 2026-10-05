// colorburst — живая палитра на главной
(function () {
  const strip = document.getElementById('livePalette');
  const hexes = document.getElementById('liveHexes');
  const meta = document.getElementById('liveMeta');
  const status = document.getElementById('liveStatus');

  if (!strip || !hexes) return;

  const harmonies = ['analogous', 'complementary', 'triadic', 'tetradic', 'split', 'monochromatic'];
  const labels = {
    analogous: 'соседние',
    complementary: 'контраст',
    triadic: 'триада',
    tetradic: 'четыре',
    split: 'split-comp',
    monochromatic: 'один тон'
  };

  // HSL → HEX
  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }

  function makePalette(harmony, count, sat, light) {
    const baseH = Math.random() * 360;
    const hues = [];

    switch (harmony) {
      case 'analogous': {
        const step = 24;
        for (let i = 0; i < count; i++) {
          hues.push((baseH + i * step - (count - 1) * step / 2 + 360) % 360);
        }
        break;
      }
      case 'complementary': {
        for (let i = 0; i < count; i++) {
          hues.push((baseH + i * (180 / Math.max(1, count - 1))) % 360);
        }
        break;
      }
      case 'triadic': {
        for (let i = 0; i < count; i++) hues.push((baseH + (i % 3) * 120) % 360);
        break;
      }
      case 'tetradic': {
        for (let i = 0; i < count; i++) hues.push((baseH + (i % 4) * 90) % 360);
        break;
      }
      case 'split': {
        const offsets = [0, 150, 210];
        for (let i = 0; i < count; i++) hues.push((baseH + offsets[i % 3]) % 360);
        break;
      }
      case 'monochromatic': {
        for (let i = 0; i < count; i++) hues.push(baseH);
        break;
      }
    }

    return hues.map((h, i) => {
      const l = harmony === 'monochromatic'
        ? 25 + (i * (55 / Math.max(1, count - 1)))
        : light;
      return hslToHex(h, sat, l);
    });
  }

  function updateStatus(text) {
    if (!status) return;
    status.textContent = text;
    status.classList.remove('live-changing');
    void status.offsetWidth;
    status.classList.add('live-changing');
  }

  function render() {
    const harmony = harmonies[Math.floor(Math.random() * harmonies.length)];
    const count = 5;
    const sat = 60 + Math.floor(Math.random() * 30);
    const light = 45 + Math.floor(Math.random() * 20);
    const colors = makePalette(harmony, count, sat, light);

    const spans = strip.querySelectorAll('span');
    const hexSpans = hexes.querySelectorAll('span');

    // плавная замена
    colors.forEach((c, i) => {
      if (spans[i]) spans[i].style.background = c;
      if (hexSpans[i]) hexSpans[i].textContent = c.toUpperCase();
    });

    if (meta) meta.textContent = 'Гармония: ' + (labels[harmony] || harmony) + ' · ' + count + ' цветов';
    updateStatus('создаём палитру…');
    setTimeout(() => updateStatus('готово'), 300);
  }

  render();
  setInterval(render, 3500);

  // лёгкая подсветка курсора
  document.addEventListener('mousemove', e => {
    document.body.style.setProperty('--mx', e.clientX + 'px');
    document.body.style.setProperty('--my', e.clientY + 'px');
  });

  // исторический факт — смена раз в 20 сек
  const facts = [
    'Первый в мире синтетический краситель — мовеин — случайно получил Уильям Перкин в 1856 году, пытаясь синтезировать хинин.',
    'В Древнем Египте синий пигмент получали, нагревая песок, медную руду и известь до 850 °C. Этот «египетский синий» был ярче всех аналогов почти 3000 лет.',
    'Краплак — ярко-красный пигмент — добывали из корней марены. Чтобы получить 1 кг красителя, требовалось около 10 000 растений.',
    'Пурпур в Античности стоил дороже золота: 10 000 морских улиток давали всего 1 грамм красителя. Носить его мог только император.',
    'Титановые белила появились только в 1916 году и почти мгновенно вытеснили свинцовые — они безопаснее и в 2 раза укрывистее.',
    'Ультрамарин в Средние века ценился наравне с золотом: его добывали из лазурита в Афганистане, и художники получали его по расписке.',
    'Теорию цветовых гармоний впервые системно описал Иоганнес Иттен в Баухаусе в 1920-х годах — ей до сих пор учат дизайнеров.'
  ];
  const factEl = document.getElementById('historyFact');
  if (factEl) {
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % facts.length;
      factEl.style.opacity = 0;
      setTimeout(() => {
        factEl.textContent = facts[idx];
        factEl.style.transition = 'opacity .5s';
        factEl.style.opacity = 1;
      }, 250);
    }, 20000);
  }
})();