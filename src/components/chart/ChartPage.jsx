"use client";

import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from "./ChartPage.module.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function ChartPage() {
  const [fuelTypeData, setFuelTypeData] = useState(null);
  const [stateData, setStateData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStations: 0, fuelTypes: 0, topStates: 10 });

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/custom_fuel_dataset_5000.csv');
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        // Count fuel types, states, and status codes
        const fuelTypeCounts = {};
        const stateCounts = {};
        const statusCounts = {};
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const csvRegex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const values = [];
          let match;
          
          while ((match = csvRegex.exec(line)) !== null) {
            let value = match[1];
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1).replace(/""/g, '"');
            }
            values.push(value.trim());
          }
          
          const fuelType = values[0];
          const state = values[4];
          const status = values[8];
          
          if (fuelType) {
            fuelTypeCounts[fuelType] = (fuelTypeCounts[fuelType] || 0) + 1;
          }
          
          if (state) {
            stateCounts[state] = (stateCounts[state] || 0) + 1;
          }
          
          if (status) {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          }
        }
        
        // Fuel Type Pie Chart
        const sortedFuelTypes = Object.entries(fuelTypeCounts).sort((a, b) => b[1] - a[1]);
        setFuelTypeData({
          labels: sortedFuelTypes.map(([type]) => type),
          datasets: [{
            data: sortedFuelTypes.map(([, count]) => count),
            backgroundColor: ['#1976D2', '#388E3C', '#F57C00', '#5E35B1', '#00796B'],
            borderColor: ['#1976D2', '#388E3C', '#F57C00', '#5E35B1', '#00796B'],
            borderWidth: 2,
          }],
        });
        
        // State Pie Chart (Top 10)
        const sortedStates = Object.entries(stateCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        const stateNames = {
          'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
          'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
          'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
          'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
          'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
          'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
          'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
          'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
          'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
          'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
          'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
          'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
          'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
        };
        
        setStateData({
          labels: sortedStates.map(([state]) => stateNames[state] || state),
          datasets: [{
            data: sortedStates.map(([, count]) => count),
            backgroundColor: [
              '#1976D2', '#388E3C', '#F57C00', '#5E35B1', '#00796B',
              '#C62828', '#0288D1', '#7B1FA2', '#FBC02D', '#455A64'
            ],
            borderColor: [
              '#1976D2', '#388E3C', '#F57C00', '#5E35B1', '#00796B',
              '#C62828', '#0288D1', '#7B1FA2', '#FBC02D', '#455A64'
            ],
            borderWidth: 2,
          }],
        });
        
        // Status Pie Chart
        const statusLabels = {
          'E': 'Existing',
          'P': 'Planned',
          'T': 'Temporarily Unavailable',
        };
        
        const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
        setStatusData({
          labels: sortedStatuses.map(([code]) => statusLabels[code] || code),
          datasets: [{
            data: sortedStatuses.map(([, count]) => count),
            backgroundColor: ['#388E3C', '#F57C00', '#C62828'],
            borderColor: ['#388E3C', '#F57C00', '#C62828'],
            borderWidth: 2,
          }],
        });
        
        setStats({
          totalStations: sortedFuelTypes.reduce((sum, [, count]) => sum + count, 0),
          fuelTypes: sortedFuelTypes.length,
          topStates: 10,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12,
            weight: '500',
          },
          color: '#0f172a',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading fuel station data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Fuel Station Analytics</h1>
        <p className={styles.description}>
          Comprehensive pie chart analysis of alternative fuel stations
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.chartSection}>
          <h2 className={styles.chartTitle}>Fuel Type Distribution</h2>
          <div className={styles.pieContainer}>
            {fuelTypeData && <Pie data={fuelTypeData} options={pieOptions} />}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.statsSection}>
            <h3 className={styles.statsTitle}>Statistics</h3>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Stations:</span>
              <span className={styles.statValue}>{stats.totalStations.toLocaleString()}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Fuel Types:</span>
              <span className={styles.statValue}>{stats.fuelTypes}</span>
            </div>
          </div>

          <div className={styles.insightSection}>
            <h3 className={styles.insightTitle}>Key Insights</h3>
            <ul className={styles.insightList}>
              <li className={styles.insightItem}>
                Percentage distribution by fuel type
              </li>
              <li className={styles.insightItem}>
                Visual comparison of adoption rates
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.content} style={{ marginTop: '24px' }}>
        <div className={styles.chartSection}>
          <h2 className={styles.chartTitle}>Top 10 States Distribution</h2>
          <div className={styles.pieContainer}>
            {stateData && <Pie data={stateData} options={pieOptions} />}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.insightSection}>
            <h3 className={styles.insightTitle}>State Analysis</h3>
            <ul className={styles.insightList}>
              <li className={styles.insightItem}>
                Top 10 states by station count
              </li>
              <li className={styles.insightItem}>
                Percentage share of each state
              </li>
              <li className={styles.insightItem}>
                Regional infrastructure distribution
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.content} style={{ marginTop: '24px' }}>
        <div className={styles.chartSection}>
          <h2 className={styles.chartTitle}>Operational Status Breakdown</h2>
          <div className={styles.pieContainer}>
            {statusData && <Pie data={statusData} options={pieOptions} />}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.insightSection}>
            <h3 className={styles.insightTitle}>Status Insights</h3>
            <ul className={styles.insightList}>
              <li className={styles.insightItem}>
                Green: Existing operational stations
              </li>
              <li className={styles.insightItem}>
                Orange: Planned future stations
              </li>
              <li className={styles.insightItem}>
                Red: Temporarily unavailable
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
