import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SpeedChart({ speedHistory, currentSpeed }) {
  const chartRef = useRef(null);
  const [gradientFill, setGradientFill] = useState(null);

  // Build gradient after canvas is available
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.35)');
    gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
    setGradientFill(gradient);
  }, [speedHistory]);

  const labels = speedHistory.map((s, i) =>
    i % 5 === 0 ? s.time : ''
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Speed (km/h)',
        data: speedHistory.map((s) => s.speed),
        borderColor: '#00D4FF',
        backgroundColor: gradientFill || 'rgba(0, 212, 255, 0.15)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#00D4FF',
        pointBorderColor: 'rgba(0, 212, 255, 0.5)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      title: { display: false },
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
          title: (items) => items[0]?.label || '',
          label: (item) => ` ${item.raw.toLocaleString()} km/h`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 212, 255, 0.06)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(0, 212, 255, 0.5)',
          font: { family: 'Orbitron', size: 9 },
          maxRotation: 0,
        },
        border: { display: false },
      },
      y: {
        grid: {
          color: 'rgba(0, 212, 255, 0.06)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(0, 212, 255, 0.5)',
          font: { family: 'Orbitron', size: 9 },
          callback: (v) => v.toLocaleString(),
        },
        title: {
          display: true,
          text: 'Speed (km/h)',
          color: 'rgba(0, 212, 255, 0.4)',
          font: { family: 'Space Grotesk', size: 10 },
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="card p-5 flex flex-col gap-4" style={{ height: '400px' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="section-title">ISS SPEED — LAST {Math.max(speedHistory.length, 1)} READINGS</h2>
        <div className="text-right">
          <div
            className="font-orbitron font-black text-2xl leading-none"
            style={{ color: '#F59E0B', textShadow: '0 0 20px rgba(245,158,11,0.5)' }}
          >
            {currentSpeed.toLocaleString()}
          </div>
          <div className="text-xs text-amber-400/60 font-space-grotesk mt-0.5">km/h</div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 relative">
        {speedHistory.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-3xl animate-pulse-slow">📡</div>
              <p className="text-xs font-space-grotesk" style={{ color: 'var(--text-muted)' }}>
                Collecting speed data...
              </p>
              <p className="text-xs font-space-grotesk" style={{ color: 'var(--text-muted)' }}>
                Available after 2nd position reading
              </p>
            </div>
          </div>
        ) : (
          <Line ref={chartRef} data={data} options={options} />
        )}
      </div>
    </div>
  );
}
