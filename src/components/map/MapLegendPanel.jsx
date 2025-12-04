import { iconMap } from '@/constants/mapConfig';
import styles from './MapComponent.module.css';

export default function MapLegendPanel({ 
  selectedFuelType,
  selectFuelType,
  stationStatusFilter,
  setStationStatusFilter,
  regionFilter,
  setRegionFilter,
  stateFilter,
  setStateFilter,
  ownershipFilter,
  setOwnershipFilter,
  stationCount, 
  isFilterOpen, 
  setIsFilterOpen 
}) {
  // All US states for when ELEC is selected
  const allStates = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'DC', name: 'District of Columbia' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];

  // State mapping for each region
  const regionStates = {
    new_england: [
      { code: 'CT', name: 'Connecticut' },
      { code: 'ME', name: 'Maine' },
      { code: 'MA', name: 'Massachusetts' },
      { code: 'NH', name: 'New Hampshire' },
      { code: 'RI', name: 'Rhode Island' },
      { code: 'VT', name: 'Vermont' }
    ],
    mid_atlantic: [
      { code: 'NJ', name: 'New Jersey' },
      { code: 'NY', name: 'New York' },
      { code: 'PA', name: 'Pennsylvania' }
    ],
    east_north_central: [
      { code: 'IL', name: 'Illinois' },
      { code: 'IN', name: 'Indiana' },
      { code: 'MI', name: 'Michigan' },
      { code: 'OH', name: 'Ohio' },
      { code: 'WI', name: 'Wisconsin' }
    ],
    west_north_central: [
      { code: 'IA', name: 'Iowa' },
      { code: 'KS', name: 'Kansas' },
      { code: 'MN', name: 'Minnesota' },
      { code: 'MO', name: 'Missouri' },
      { code: 'NE', name: 'Nebraska' },
      { code: 'ND', name: 'North Dakota' },
      { code: 'SD', name: 'South Dakota' }
    ],
    south_atlantic: [
      { code: 'DE', name: 'Delaware' },
      { code: 'DC', name: 'District of Columbia' },
      { code: 'FL', name: 'Florida' },
      { code: 'GA', name: 'Georgia' },
      { code: 'MD', name: 'Maryland' },
      { code: 'NC', name: 'North Carolina' },
      { code: 'SC', name: 'South Carolina' },
      { code: 'VA', name: 'Virginia' },
      { code: 'WV', name: 'West Virginia' }
    ],
    east_south_central: [
      { code: 'AL', name: 'Alabama' },
      { code: 'KY', name: 'Kentucky' },
      { code: 'MS', name: 'Mississippi' },
      { code: 'TN', name: 'Tennessee' }
    ],
    west_south_central: [
      { code: 'AR', name: 'Arkansas' },
      { code: 'LA', name: 'Louisiana' },
      { code: 'OK', name: 'Oklahoma' },
      { code: 'TX', name: 'Texas' }
    ],
    mountain: [
      { code: 'AZ', name: 'Arizona' },
      { code: 'CO', name: 'Colorado' },
      { code: 'ID', name: 'Idaho' },
      { code: 'MT', name: 'Montana' },
      { code: 'NV', name: 'Nevada' },
      { code: 'NM', name: 'New Mexico' },
      { code: 'UT', name: 'Utah' },
      { code: 'WY', name: 'Wyoming' }
    ],
    pacific: [
      { code: 'AK', name: 'Alaska' },
      { code: 'CA', name: 'California' },
      { code: 'HI', name: 'Hawaii' },
      { code: 'OR', name: 'Oregon' },
      { code: 'WA', name: 'Washington' }
    ]
  };

  // Get available states based on fuel type and selected region
  const availableStates = selectedFuelType === 'elec' 
    ? allStates 
    : (regionFilter === 'all' ? [] : (regionStates[regionFilter] || []));

  // Handle region change and reset state filter
  const handleRegionChange = (e) => {
    setRegionFilter(e.target.value);
    setStateFilter('all'); // Reset state when region changes
  };
  const legends = [
    { key: 'available', label: 'Available Stations', icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' },
    { key: 'planned', label: 'Planned Stations', icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' },
  ];

  const fuelLegends = [
    { key: 'elec', label: 'Electric (ELEC)', icon: iconMap.elec },
    { key: 'cng', label: 'CNG', icon: iconMap.cng },
  ];

  return (
    <>
      <div className={styles.legendSection}>
        <h3 className={styles.sectionTitle}>Station Status</h3>
        {legends.map(({ key, label, icon }) => (
          <div key={key} className={styles.legendItem}>
            <img src={icon} className={styles.legendIcon} alt={label} />
            <span className={styles.legendLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.filterTriggerSection}>
        <button 
          className={styles.filterTriggerButton}
          onClick={() => setIsFilterOpen(true)}
        >
          <span>🔍</span>
          <span>Filter Stations</span>
        </button>
      </div>

      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Statistics</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Stations Displayed</span>
            <span className={styles.statValue}>{stationCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Slide Panel */}
      {isFilterOpen && (
        <div className={styles.filterOverlay} onClick={() => setIsFilterOpen(false)}>
          <div 
            className={`${styles.filterSlidePanel} ${isFilterOpen ? styles.open : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.filterPanelHeader}>
              <h3 className={styles.filterPanelTitle}>Filters</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsFilterOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.filterPanelContent}>
              {/* Region Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Region</h4>
                <div className={styles.filterItems}>
                  <select
                    className={styles.filterSelect}
                    value={regionFilter}
                    onChange={handleRegionChange}
                    disabled={selectedFuelType === 'elec'}
                  >
                    <option value="all">All Regions</option>
                    <option value="new_england">New England</option>
                    <option value="mid_atlantic">Mid-Atlantic</option>
                    <option value="east_north_central">East North Central</option>
                    <option value="west_north_central">West North Central</option>
                    <option value="south_atlantic">South Atlantic</option>
                    <option value="east_south_central">East South Central</option>
                    <option value="west_south_central">West South Central</option>
                    <option value="mountain">Mountain</option>
                    <option value="pacific">Pacific</option>
                  </select>
                </div>
              </div>

              {/* State Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>State</h4>
                <div className={styles.filterItems}>
                  <select
                    className={styles.filterSelect}
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    disabled={selectedFuelType !== 'elec' && regionFilter === 'all'}
                  >
                    <option value="all">
                      {selectedFuelType === 'elec' 
                        ? 'All States' 
                        : (regionFilter === 'all' ? 'Select a region first' : 'All States in Region')}
                    </option>
                    {availableStates.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ownership Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Ownership</h4>
                <div className={styles.filterItems}>
                  <select 
                    className={styles.filterSelect}
                    value={ownershipFilter}
                    onChange={(e) => setOwnershipFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {/* Fuel Type Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Fuel Type</h4>
                <div className={styles.filterItems}>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="fuelType"
                      className={styles.filterCheckbox}
                      checked={selectedFuelType === 'all'}
                      onChange={() => selectFuelType('all')}
                    />
                    <span>All Fuel Types</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="fuelType"
                      className={styles.filterCheckbox}
                      checked={selectedFuelType === 'cng'}
                      onChange={() => selectFuelType('cng')}
                    />
                    <span>CNG</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="fuelType"
                      className={styles.filterCheckbox}
                      checked={selectedFuelType === 'elec'}
                      onChange={() => selectFuelType('elec')}
                    />
                    <span>Electric (ELEC)</span>
                  </label>
                </div>
              </div>

              {/* Station Status Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Station Status</h4>
                <div className={styles.filterItems}>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="stationStatus"
                      className={styles.filterCheckbox}
                      checked={stationStatusFilter === 'all'}
                      onChange={() => setStationStatusFilter('all')}
                    />
                    <span>All</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="stationStatus"
                      className={styles.filterCheckbox}
                      checked={stationStatusFilter === 'available'}
                      onChange={() => setStationStatusFilter('available')}
                    />
                    <span>Available</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="stationStatus"
                      className={styles.filterCheckbox}
                      checked={stationStatusFilter === 'planned'}
                      onChange={() => setStationStatusFilter('planned')}
                    />
                    <span>Planned</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
