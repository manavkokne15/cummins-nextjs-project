"use client";

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from "./GraphPage.module.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function GraphPage() {
  const [chartData, setChartData] = useState(null);
  const [stateChartData, setStateChartData] = useState(null);
  const [statusChartData, setStatusChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStations: 0, fuelTypes: 0, topStates: 0 });

  useEffect(() => {
    async function loadFuelData() {
      try {
        const response = await fetch('/custom_fuel_dataset_5000.csv');
        const csvText = await response.text();
        
        // Parse CSV properly with proper handling of quoted fields
        const lines = csvText.split('\n');
        
        // Count fuel types, states, and status codes
        const fuelTypeCounts = {};
        const stateCounts = {};
        const statusCounts = {};
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Properly parse CSV line with quoted fields
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
          
          // Expected column order from CSV header:
          // Fuel_Type_Code(0), Station_Name(1), Street_Address(2), City(3), State(4), 
          // ZIP(5), Plus4(6), Country(7), Status_Code(8), Station_Phone(9), Expected_Date(10), 
          // Access_Code(11), Latitude(12), Longitude(13), ID(14)
          
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
        
        console.log('Fuel Type Counts:', fuelTypeCounts);
        console.log('State Counts:', stateCounts);
        console.log('Status Counts:', statusCounts);
        
        // Sort by count descending
        const sortedEntries = Object.entries(fuelTypeCounts)
          .sort((a, b) => b[1] - a[1]);
        
        const labels = sortedEntries.map(([type]) => type);
        const data = sortedEntries.map(([, count]) => count);
        
        // Professional, modern industry-standard color palette for fuel types
        const colors = [
          '#1976D2', // Blue 700
          '#388E3C', // Green 700
          '#F57C00', // Orange 700
          '#5E35B1', // Deep Purple 600
          '#00796B', // Teal 700
          '#C62828', // Red 800
          '#0288D1', // Light Blue 700
          '#7B1FA2', // Purple 700
        ];
        
        setChartData({
          labels,
          datasets: [
            {
              label: 'Number of Stations',
              data,
              backgroundColor: colors.slice(0, labels.length),
              borderColor: colors.slice(0, labels.length).map(c => c),
              borderWidth: 2,
              borderRadius: 6,
              barThickness: 60,
            },
          ],
        });
        
        // State abbreviation to full name mapping
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
        
        // Prepare state chart data (top 10 states)
        const sortedStates = Object.entries(stateCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10); // Top 10 states only
        
        const stateLabels = sortedStates.map(([state]) => stateNames[state] || state);
        const stateData = sortedStates.map(([, count]) => count);
        
        // Professional, modern industry-standard color palette (Material Design inspired)
        const stateColors = [
          '#1976D2', // Blue 700
          '#388E3C', // Green 700
          '#F57C00', // Orange 700
          '#5E35B1', // Deep Purple 600
          '#00796B', // Teal 700
          '#C62828', // Red 800
          '#0288D1', // Light Blue 700
          '#7B1FA2', // Purple 700
          '#FBC02D', // Yellow 700
          '#455A64'  // Blue Grey 700
        ];
        
        setStateChartData({
          labels: stateLabels,
          datasets: [
            {
              label: 'Number of Stations',
              data: stateData,
              backgroundColor: stateColors,
              borderColor: stateColors,
              borderWidth: 2,
              borderRadius: 6,
              barThickness: 50,
            },
          ],
        });
        
        // Prepare status chart data by state
        // Create a structure: { state: { E: count, P: count, T: count } }
        const stateStatusBreakdown = {};
        
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
          
          const state = values[4];
          const status = values[8];
          
          if (state && status) {
            if (!stateStatusBreakdown[state]) {
              stateStatusBreakdown[state] = { E: 0, P: 0, T: 0 };
            }
            if (status === 'E' || status === 'P' || status === 'T') {
              stateStatusBreakdown[state][status]++;
            }
          }
        }
        
        // Get top 10 states by total stations
        const statesWithTotals = Object.entries(stateStatusBreakdown)
          .map(([state, statuses]) => ({
            state,
            total: statuses.E + statuses.P + statuses.T,
            ...statuses
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);
        
        const statusStateLabels = statesWithTotals.map(s => stateNames[s.state] || s.state);
        const existingData = statesWithTotals.map(s => s.E);
        const plannedData = statesWithTotals.map(s => s.P);
        const unavailableData = statesWithTotals.map(s => s.T);
        
        setStatusChartData({
          labels: statusStateLabels,
          datasets: [
            {
              label: 'Existing',
              data: existingData,
              backgroundColor: '#388E3C', // Green 700
              borderColor: '#388E3C',
              borderWidth: 2,
              borderRadius: 6,
            },
            {
              label: 'Planned',
              data: plannedData,
              backgroundColor: '#F57C00', // Orange 700
              borderColor: '#F57C00',
              borderWidth: 2,
              borderRadius: 6,
            },
            {
              label: 'Temporarily Unavailable',
              data: unavailableData,
              backgroundColor: '#C62828', // Red 800
              borderColor: '#C62828',
              borderWidth: 2,
              borderRadius: 6,
            },
          ],
        });
        
        setStats({
          totalStations: data.reduce((sum, count) => sum + count, 0),
          fuelTypes: labels.length,
          topStates: 10,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading fuel data:', error);
        setLoading(false);
      }
    }
    
    loadFuelData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
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
            return `Stations: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500',
          },
          color: '#64748b',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#64748b',
          callback: function(value) {
            return value.toLocaleString();
          },
        },
      },
    },
  };

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
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
      title: {
        display: false,
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
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            weight: '500',
          },
          color: '#64748b',
        },
      },
      y: {
        stacked: false,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#64748b',
          callback: function(value) {
            return value.toLocaleString();
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
        <h1 className={styles.title}>Fuel Type Distribution</h1>
        <p className={styles.description}>
          Analysis of alternative fuel stations by fuel type across the United States
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.chartSection}>
          <h2 className={styles.chartTitle}>Fuel Type Count</h2>
          <div className={styles.chartContainer}>
            {chartData && <Bar data={chartData} options={options} />}
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
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Top States Shown:</span>
              <span className={styles.statValue}>{stats.topStates}</span>
            </div>
          </div>

          <div className={styles.insightSection}>
            <h3 className={styles.insightTitle}>Key Insights</h3>
            <ul className={styles.insightList}>
              <li className={styles.insightItem}>
                Distribution of alternative fuel adoption
              </li>
              <li className={styles.insightItem}>
                Most common fuel types identified
              </li>
              <li className={styles.insightItem}>
                Regional infrastructure analysis by state
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.content} style={{ marginTop: '24px' }}>
        <div className={styles.chartSection}>
          <h2 className={styles.chartTitle}>Stations per State</h2>
          <div className={styles.chartContainer}>
            {stateChartData && <Bar data={stateChartData} options={options} />}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.insightSection}>
            <h3 className={styles.insightTitle}>State Analysis</h3>
            <ul className={styles.insightList}>
              <li className={styles.insightItem}>
                Top 10 states with highest station concentration
              </li>
              <li className={styles.insightItem}>
                Useful for regional infrastructure planning
              </li>
              <li className={styles.insightItem}>
                Shows geographic distribution patterns
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.content} style={{ marginTop: '24px' }}>
        <div className={styles.chartSection}>
          <h2 className={styles.chartTitle}>Station Operational Status by State</h2>
          <div className={styles.chartContainer}>
            {statusChartData && <Bar data={statusChartData} options={statusChartOptions} />}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.insightSection}>
            <h3 className={styles.insightTitle}>Status Insights</h3>
            <ul className={styles.insightList}>
              <li className={styles.insightItem}>
                Operational status breakdown by state
              </li>
              <li className={styles.insightItem}>
                Green: Existing operational stations
              </li>
              <li className={styles.insightItem}>
                Orange: Planned future stations
              </li>
              <li className={styles.insightItem}>
                Red: Temporarily unavailable stations
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
