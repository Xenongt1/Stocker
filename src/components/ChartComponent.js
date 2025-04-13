import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function ChartComponent({ type = 'bar', data, options = {}, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      x: {
        ticks: {
          padding: 10 // Add padding to x-axis ticks
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  const renderChart = () => {
    switch(type.toLowerCase()) {
      case 'line':
        return <Line data={data} options={mergedOptions} height={height} />;
      case 'pie':
        return <Pie data={data} options={mergedOptions} height={height} />;
      case 'bar':
      default:
        return <Bar data={data} options={mergedOptions} height={height} />;
    }
  };
  
  return (
    <div style={{ height: `${height}px` }}>
      {renderChart()}
    </div>
  );
}

export default ChartComponent;