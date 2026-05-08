import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

// Center-text plugin
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const total = chart.data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();

    // Number
    ctx.font = '900 28px Orbitron, sans-serif';
    ctx.fillStyle = '#00D4FF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(total, cx, cy - 8);

    // Label
    ctx.font = '500 10px Space Grotesk, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.shadowBlur = 0;
    ctx.fillText('ARTICLES', cx, cy + 16);

    ctx.restore();
  },
};

ChartJS.register(centerTextPlugin);

const COLORS = [
  '#00D4FF',
  '#7C3AED',
  '#F59E0B',
  '#10B981',
  '#F43F5E',
  '#F97316',
  '#6366F1',
  '#14B8A6',
];

function countByCategory(articles) {
  const counts = {};
  articles.forEach((a) => {
    const cat = a.category || 'Uncategorized';
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return counts;
}

export default function NewsChart({ articles, setSelectedCategory }) {
  const counts = countByCategory(articles);
  const labels = Object.keys(counts);
  const values = Object.values(counts);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => `${COLORS[i % COLORS.length]}CC`),
        borderColor: labels.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 2,
        hoverOffset: 8,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    animation: { duration: 600, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(148, 163, 184, 0.8)',
          font: { family: 'Space Grotesk', size: 10 },
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
          boxHeight: 6,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(2, 8, 23, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.4)',
        borderWidth: 1,
        titleColor: '#00D4FF',
        bodyColor: '#E2E8F0',
        titleFont: { family: 'Orbitron', size: 10 },
        bodyFont: { family: 'Space Grotesk', size: 11 },
        padding: 10,
        callbacks: {
          label: (item) =>
            ` ${item.label}: ${item.raw} article${item.raw !== 1 ? 's' : ''}`,
        },
      },
      centerText: true,
    },
    onClick(event, elements) {
      if (elements.length > 0) {
        const idx = elements[0].index;
        const category = labels[idx];
        setSelectedCategory?.(category);
      }
    },
    onHover(event, elements) {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    },
  };

  return (
    <div className="card p-5 flex flex-col gap-4" style={{ height: '400px' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="section-title">NEWS DISTRIBUTION</h2>
        <span
          className="text-xs font-space-grotesk px-2 py-1 rounded-full"
          style={{
            background: 'rgba(0, 212, 255, 0.08)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            color: 'rgba(0, 212, 255, 0.7)',
          }}
        >
          Click slice to filter
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 relative">
        {articles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-3xl animate-pulse-slow">📰</div>
              <p className="text-xs font-space-grotesk" style={{ color: 'var(--text-muted)' }}>
                Loading news data...
              </p>
            </div>
          </div>
        ) : (
          <Doughnut data={data} options={options} />
        )}
      </div>
    </div>
  );
}
