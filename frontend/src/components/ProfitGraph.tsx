import { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration, ScriptableContext, ScriptableLineSegmentContext } from 'chart.js/auto';

interface ProfitGraphProps {
  history: {
    timestamps: string[];
    total_profits: number[];
  };
}

export default function ProfitGraph({ history }: ProfitGraphProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Format timestamps for display
    const labels = history.timestamps.map(ts => {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    // If we only have one data point, create a leading line
    const chartLabels = [...labels];
    const chartData = [...history.total_profits];

    if (history.total_profits.length === 1) {
      // Add a point 25% of the way from the left
      const leadingTime = new Date(new Date(history.timestamps[0]).getTime() - 15 * 60000); // 15 minutes before
      chartLabels.unshift(leadingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      chartData.unshift(0); // Start from 0
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Total Profit/Loss',
          data: chartData,
          borderColor: (ctx: ScriptableContext<'line'>) => {
            const value = chartData[ctx.dataIndex];
            return value >= 0 ? '#2ecc71' : '#e74c3c';
          },
          segment: {
            borderColor: (ctx: ScriptableLineSegmentContext) => {
              const index = ctx.p1.parsed.y !== undefined ? ctx.p1.parsed.y : 0;
              return index >= 0 ? '#2ecc71' : '#e74c3c';
            }
          },
          tension: 0.1,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    };

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = new Chart(chartRef.current, config);

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [history]);

  return <canvas ref={chartRef} />;
} 