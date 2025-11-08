let radar1, radar2;
let chartColor = '#92dfec';

function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ===== PLUGINS ===== */

// === MAIN CHART LABELS (white inside, colored outline, values) ===
const outlinedLabelsPlugin = {
  id: 'outlinedLabels',
  afterDraw(chart) {
    if (chart.canvas.id !== 'radarChart1') return;
    const ctx = chart.ctx;
    const r = chart.scales.r;
    const labels = chart.data.labels;
    const values = getStatValues();
    const baseRadius = r.drawingArea * 1.05; // tighter radius
    const base = -Math.PI / 2;

    labels.forEach((label, i) => {
      const a = base + (i * 2 * Math.PI / labels.length);
      const x = r.xCenter + baseRadius * Math.cos(a);
      const y = r.yCenter + baseRadius * Math.sin(a);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '17px Candara';
      ctx.lineWidth = 4;
      ctx.strokeStyle = chartColor;
      ctx.fillStyle = 'white';
      ctx.strokeText(label, x, y - 5);
      ctx.fillText(label, x, y - 5);

      // value in parentheses under axis title
      ctx.font = 'italic 14px Candara';
      ctx.fillStyle = '#000';
      const val = isNaN(values[i]) ? 0 : values[i].toFixed(1);
      ctx.fillText(`(${val})`, x, y + 13);
      ctx.restore();
    });
  }
};

// === OVERLAY CHART LABELS (white inside, colored outline) ===
const overlayLabelsPlugin = {
  id: 'overlayLabels',
  afterDraw(chart) {
    if (chart.canvas.id !== 'radarChart2') return;
    const ctx = chart.ctx;
    const r = chart.scales.r;
    const labels = chart.data.labels;
    const baseRadius = r.drawingArea * 1.0;
    const base = -Math.PI / 2;

    labels.forEach((label, i) => {
      const a = base + (i * 2 * Math.PI / labels.length);
      const x = r.xCenter + baseRadius * Math.cos(a);
      const y = r.yCenter + baseRadius * Math.sin(a);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '18px Candara';
      ctx.lineWidth = 4;
      ctx.strokeStyle = chartColor;
      ctx.fillStyle = 'white';
      ctx.strokeText(label, x, y);
      ctx.fillText(label, x, y);
      ctx.restore();
    });
  }
};

// === OVERLAY BACKGROUND (gradient pentagon + border) ===
const radarBackgroundPlugin = {
  id: 'customBackground',
  beforeDraw(chart) {
    if (chart.canvas.id !== 'radarChart2') return;
    const ctx = chart.ctx;
    const r = chart.scales.r;
    const cx = r.xCenter;
    const cy = r.yCenter;
    const radius = r.drawingArea * 0.9;
    const N = chart.data.labels.length;
    const start = -Math.PI / 2;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, '#92dfec');
    grad.addColorStop(0.4, '#f8fcff');
    grad.addColorStop(1, '#f8fcff');

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = start + (i * 2 * Math.PI / N);
      const x = cx + radius * Math.cos(a);
      const y = cy + radius * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#184046';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
};

Chart.register(outlinedLabelsPlugin, overlayLabelsPlugin, radarBackgroundPlugin);

/* ===== CHART CREATION ===== */
function makeRadar(ctx, isOverlay = false) {
  const color = document.getElementById('colorPicker').value || '#92dfec';

  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: hexToRGBA(color, 0.7),
        borderColor: color,
        borderWidth: 2,
        pointRadius: isOverlay ? 0 : 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: isOverlay ? 25 : 25 },
      elements: { line: { tension: 0 } },
      scales: {
        r: {
          min: 0,
          // dynamic max for main chart, fixed 10 for overlay
          max: isOverlay ? 10 : undefined,
          suggestedMax: isOverlay ? 10 : undefined,
          ticks: { display: false },
          grid: { display: false },
          angleLines: { color: '#6db5c0' },
          pointLabels: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    },
    plugins: isOverlay
      ? [radarBackgroundPlugin, overlayLabelsPlugin]
      : [outlinedLabelsPlugin]
  });
}

/* ===== DOM + UPDATE ===== */
const inputs = ['powerInput', 'speedInput', 'trickInput', 'recoveryInput', 'defenseInput'];
const colorPicker = document.getElementById('colorPicker');
const viewBtn = document.getElementById('viewBtn');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const uploadedImg = document.getElementById('uploadedImg');
const imgInput = document.getElementById('imgInput');

window.addEventListener('load', () => {
  const ctx1 = document.getElementById('radarChart1').getContext('2d');
  radar1 = makeRadar(ctx1, false);
  updateCharts();
});

function getStatValues() {
  return inputs.map(id => +document.getElementById(id).value || 0);
}

function updateCharts() {
  const vals = getStatValues();
  const cappedVals = vals.map(v => Math.min(v, 10));
  chartColor = colorPicker.value;
  const fill = hexToRGBA(chartColor, 0.7);

  // dynamic max for main radar (auto scales)
  const maxVal = Math.max(...vals, 10);
  radar1.options.scales.r.max = maxVal + maxVal * 0.1;

  radar1.data.datasets[0].data = vals;
  radar1.data.datasets[0].borderColor = chartColor;
  radar1.data.datasets[0].backgroundColor = fill;
  radar1.update();

  if (radar2) {
    radar2.data.datasets[0].data = cappedVals;
    radar2.data.datasets[0].borderColor = chartColor;
    radar2.data.datasets[0].backgroundColor = fill;
    radar2.update();
  }
}

inputs.forEach(id => document.getElementById(id).addEventListener('input', updateCharts));
colorPicker.addEventListener('input', updateCharts);
['nameInput', 'abilityInput', 'levelInput'].forEach(id =>
  document.getElementById(id).addEventListener('input', updateCharts)
);

viewBtn.addEventListener('click', () => {
  overlay.classList.remove('hidden');
  document.getElementById('overlayImg').src = uploadedImg.src;
  document.getElementById('overlayName').textContent =
    document.getElementById('nameInput').value || '-';
  document.getElementById('overlayAbility').textContent =
    document.getElementById('abilityInput').value || '-';
  document.getElementById('overlayLevel').textContent =
    document.getElementById('levelInput').value || '-';

  const ctx2 = document.getElementById('radarChart2').getContext('2d');
  if (radar2) radar2.destroy();
  radar2 = makeRadar(ctx2, true);
  updateCharts();
});

closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

downloadBtn.addEventListener('click', () => {
  downloadBtn.style.visibility = 'hidden';
  closeBtn.style.visibility = 'hidden';
  html2canvas(document.getElementById('characterBox'), { scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = `${document.getElementById('nameInput').value || 'Character'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    downloadBtn.style.visibility = 'visible';
    closeBtn.style.visibility = 'visible';
  });
});

imgInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { uploadedImg.src = ev.target.result; };
  reader.readAsDataURL(file);
});
