// ========== SETUP ==========
let charts = [];
let activeIndex = 0;
const BASE_COLOR = '#92dfec';
const FILL_ALPHA = 0.65;

// Color pickers grouped by axis
const axisColorPickers = [
  document.getElementById('powerColor'),
  document.getElementById('speedColor'),
  document.getElementById('trickColor'),
  document.getElementById('recoveryColor'),
  document.getElementById('defenseColor')
];

// Hide color wheels initially
axisColorPickers.forEach(p => p.style.display = 'none');

function refreshAll() {
  charts.forEach(obj => {
    const ds = obj.chart.data.datasets[0];
    const fill = obj.multi
      ? makeConicGradient(obj.chart, obj.axis, FILL_ALPHA)
      : hexToRGBA(obj.color, FILL_ALPHA);

    // multicolor outline always uses ability color
    ds.borderColor = obj.multi ? obj.color : obj.color;
    ds.backgroundColor = fill;
    ds.pointBorderColor = obj.color;
    ds.data = obj.stats.map(v => Math.min(v, 10));
    obj.chart.update();
  });
}

multiColorBtn.addEventListener('click', () => {
  const c = charts[activeIndex];
  c.multi = !c.multi;
  multiColorBtn.textContent = c.multi ? 'Single-color' : 'Multi-color';

  axisColorPickers.forEach(p => p.style.display = c.multi ? 'inline-block' : 'none');
  refreshAll();
});
