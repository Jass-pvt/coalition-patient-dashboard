export const CHART_COLORS = {
  systolic: '#E66FD2',
  diastolic: '#8C6FE6',
  grid: '#CBC8D4',
  tick: '#072635',
}

const dataset = (label, color, values) => ({
  label,
  data: values,
  borderColor: color,
  backgroundColor: color,
  pointBackgroundColor: color,
  pointBorderColor: '#FFFFFF',
  pointBorderWidth: 2,
  pointRadius: 6,
  pointHoverRadius: 8,
  borderWidth: 2,
  tension: 0.4,
})

/** Transforms normalized history entries into Chart.js data. No values are invented. */
export function buildChartData(entries) {
  return {
    labels: entries.map((e) => e.label),
    datasets: [
      dataset(
        'Systolic',
        CHART_COLORS.systolic,
        entries.map((e) => e.systolic.value),
      ),
      dataset(
        'Diastolic',
        CHART_COLORS.diastolic,
        entries.map((e) => e.diastolic.value),
      ),
    ],
  }
}

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false }, // custom legend lives in the panel
    tooltip: {
      callbacks: {
        label: (ctx) =>
          ctx.parsed.y === null
            ? `${ctx.dataset.label}: n/a`
            : `${ctx.dataset.label}: ${ctx.parsed.y} mmHg`,
      },
    },
  },
  scales: {
    y: {
      min: 60,
      max: 180,
      ticks: { stepSize: 20, color: CHART_COLORS.tick, font: { size: 12 }, padding: 8 },
      grid: { color: CHART_COLORS.grid, drawTicks: false },
      border: { display: false },
    },
    x: {
      ticks: { color: CHART_COLORS.tick, font: { size: 12 }, padding: 8 },
      grid: { display: false },
      border: { color: CHART_COLORS.grid },
    },
  },
}
