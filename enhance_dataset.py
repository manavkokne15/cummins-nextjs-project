import pandas as pd
import numpy as np

# Load the existing dataset
df = pd.read_csv('public/vehicle_demo_data.csv')

# Define US regions mapping
us_regions = {
    'Northeast': ['Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 
                  'Connecticut', 'New York', 'New Jersey', 'Pennsylvania'],
    'Midwest': ['Ohio', 'Michigan', 'Indiana', 'Wisconsin', 'Illinois', 'Minnesota', 
                'Iowa', 'Missouri', 'North Dakota', 'South Dakota', 'Nebraska', 'Kansas'],
    'South': ['Delaware', 'Maryland', 'Virginia', 'West Virginia', 'Kentucky', 'Tennessee',
              'North Carolina', 'South Carolina', 'Georgia', 'Florida', 'Alabama', 
              'Mississippi', 'Arkansas', 'Louisiana', 'Oklahoma', 'Texas'],
    'West': ['Montana', 'Idaho', 'Wyoming', 'Colorado', 'New Mexico', 'Arizona', 'Utah',
             'Nevada', 'Washington', 'Oregon', 'California', 'Alaska', 'Hawaii']
}

# Create a reverse mapping for state to region
state_to_region = {}
for region, states in us_regions.items():
    for state in states:
        state_to_region[state] = region

# Add Region column
df['Region'] = df['State'].map(state_to_region)

# Calculate concentration logic for each vehicle class and region
def calculate_concentration_type(df):
    concentration_data = []
    
    for _, row in df.iterrows():
        state = row['State']
        vehicle_class = row['Vehicle_Class']
        region = row['Region']
        
        # Calculate vehicle class distribution by region
        class_in_region = df[(df['Region'] == region) & (df['Vehicle_Class'] == vehicle_class)]['Vehicle_Count'].sum()
        class_in_state = df[(df['State'] == state) & (df['Vehicle_Class'] == vehicle_class)]['Vehicle_Count'].sum()
        total_class = df[df['Vehicle_Class'] == vehicle_class]['Vehicle_Count'].sum()
        
        # Calculate percentage of this class in current state vs total for this class
        state_percentage = (class_in_state / total_class) * 100 if total_class > 0 else 0
        
        # Define concentration based on state percentage for this vehicle class
        if state_percentage >= 8:  # High concentration threshold
            concentration = 0  # Highly Concentrated
        elif state_percentage >= 3:  # Substantial concentration threshold  
            concentration = 1  # Substantially Concentrated
        else:
            concentration = 2  # National (distributed)
            
        concentration_data.append(concentration)
    
    return concentration_data

# Add Concentration_Type column
df['Concentration_Type'] = calculate_concentration_type(df)

# Map concentration values to descriptive names for verification
concentration_map = {0: 'Highly Concentrated', 1: 'Substantially Concentrated', 2: 'National'}
df['Concentration_Description'] = df['Concentration_Type'].map(concentration_map)

# Save the updated dataset
df.to_csv('public/vehicle_demo_data_enhanced.csv', index=False)

print("Dataset enhanced successfully!")
print(f"Total rows: {len(df)}")
print(f"Regions: {df['Region'].unique()}")
print(f"Concentration types: {df['Concentration_Description'].value_counts()}")
print("\nSample data:")
print(df[['State', 'Vehicle_Class', 'Region', 'Concentration_Type', 'Concentration_Description']].head(10))