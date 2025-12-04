import pandas as pd
import numpy as np

# Load the existing dataset
df = pd.read_csv('public/vehicle_demo_data_enhanced.csv')

# Enhanced concentration logic with better distribution
def calculate_enhanced_concentration_type(df):
    concentration_data = []
    
    # Calculate total vehicles by class and state for better thresholds
    class_state_totals = df.groupby(['Vehicle_Class', 'State'])['Vehicle_Count'].sum().to_dict()
    class_totals = df.groupby('Vehicle_Class')['Vehicle_Count'].sum().to_dict()
    
    for _, row in df.iterrows():
        state = row['State']
        vehicle_class = row['Vehicle_Class']
        
        # Get totals for this class and state
        state_total = class_state_totals.get((vehicle_class, state), 0)
        class_total = class_totals.get(vehicle_class, 1)
        
        # Calculate percentage of this class in current state vs total for this class
        state_percentage = (state_total / class_total) * 100 if class_total > 0 else 0
        
        # Enhanced concentration logic with better distribution
        if state_percentage >= 15:  # Highly concentrated (top states)
            concentration = 0
        elif state_percentage >= 5:   # Substantially concentrated (medium states)
            concentration = 1
        else:                         # National distribution (lower presence)
            concentration = 2
            
        concentration_data.append(concentration)
    
    return concentration_data

# Recalculate concentration types with enhanced logic
df['Concentration_Type'] = calculate_enhanced_concentration_type(df)

# Map concentration values to descriptive names
concentration_map = {0: 'Highly Concentrated', 1: 'Substantially Concentrated', 2: 'National'}
df['Concentration_Description'] = df['Concentration_Type'].map(concentration_map)

# Add some strategic entries to ensure all regions have diverse concentration types
additional_entries = [
    # California - High concentration for Class 6
    {'State': 'California', 'City': 'Los Angeles', 'Vehicle_Count': 250, 'Vehicle_Class': 6, 
     'Vehicle_Type': 'Medium Duty', 'Fuel_Type': 'CNG', 'Region': 'West', 
     'Concentration_Type': 0, 'Concentration_Description': 'Highly Concentrated'},
    {'State': 'California', 'City': 'San Francisco', 'Vehicle_Count': 180, 'Vehicle_Class': 6, 
     'Vehicle_Type': 'Medium Duty', 'Fuel_Type': 'EV', 'Region': 'West', 
     'Concentration_Type': 0, 'Concentration_Description': 'Highly Concentrated'},
    
    # Texas - High concentration for Class 8
    {'State': 'Texas', 'City': 'Houston', 'Vehicle_Count': 300, 'Vehicle_Class': 8, 
     'Vehicle_Type': 'Heavy Duty', 'Fuel_Type': 'CNG', 'Region': 'South', 
     'Concentration_Type': 0, 'Concentration_Description': 'Highly Concentrated'},
    {'State': 'Texas', 'City': 'Dallas', 'Vehicle_Count': 220, 'Vehicle_Class': 8, 
     'Vehicle_Type': 'Heavy Duty', 'Fuel_Type': 'Diesel', 'Region': 'South', 
     'Concentration_Type': 0, 'Concentration_Description': 'Highly Concentrated'},
    
    # Illinois - High concentration for Class 7
    {'State': 'Illinois', 'City': 'Chicago', 'Vehicle_Count': 280, 'Vehicle_Class': 7, 
     'Vehicle_Type': 'Heavy-Medium Duty', 'Fuel_Type': 'CNG', 'Region': 'Midwest', 
     'Concentration_Type': 0, 'Concentration_Description': 'Highly Concentrated'},
    
    # New York - High concentration for Class 6
    {'State': 'New York', 'City': 'New York', 'Vehicle_Count': 320, 'Vehicle_Class': 6, 
     'Vehicle_Type': 'Medium Duty', 'Fuel_Type': 'EV', 'Region': 'Northeast', 
     'Concentration_Type': 0, 'Concentration_Description': 'Highly Concentrated'},
     
    # Substantial concentrations across regions
    {'State': 'Florida', 'City': 'Miami', 'Vehicle_Count': 120, 'Vehicle_Class': 7, 
     'Vehicle_Type': 'Heavy-Medium Duty', 'Fuel_Type': 'CNG', 'Region': 'South', 
     'Concentration_Type': 1, 'Concentration_Description': 'Substantially Concentrated'},
    {'State': 'Arizona', 'City': 'Phoenix', 'Vehicle_Count': 95, 'Vehicle_Class': 8, 
     'Vehicle_Type': 'Heavy Duty', 'Fuel_Type': 'CNG', 'Region': 'West', 
     'Concentration_Type': 1, 'Concentration_Description': 'Substantially Concentrated'},
    {'State': 'Michigan', 'City': 'Detroit', 'Vehicle_Count': 110, 'Vehicle_Class': 6, 
     'Vehicle_Type': 'Medium Duty', 'Fuel_Type': 'CNG', 'Region': 'Midwest', 
     'Concentration_Type': 1, 'Concentration_Description': 'Substantially Concentrated'},
    {'State': 'Massachusetts', 'City': 'Boston', 'Vehicle_Count': 85, 'Vehicle_Class': 7, 
     'Vehicle_Type': 'Heavy-Medium Duty', 'Fuel_Type': 'EV', 'Region': 'Northeast', 
     'Concentration_Type': 1, 'Concentration_Description': 'Substantially Concentrated'},
]

# Add these entries to the dataframe
additional_df = pd.DataFrame(additional_entries)
df = pd.concat([df, additional_df], ignore_index=True)

# Save the enhanced dataset
df.to_csv('public/vehicle_demo_data_enhanced.csv', index=False)

print("Enhanced dataset created successfully!")
print(f"Total rows: {len(df)}")
print("\nConcentration distribution by class:")
for vehicle_class in sorted(df['Vehicle_Class'].unique()):
    class_data = df[df['Vehicle_Class'] == vehicle_class]
    concentration_counts = class_data['Concentration_Description'].value_counts()
    print(f"\nClass {vehicle_class}:")
    for conc_type, count in concentration_counts.items():
        print(f"  {conc_type}: {count} locations")

print("\nConcentration distribution by region:")
for region in sorted(df['Region'].unique()):
    region_data = df[df['Region'] == region]
    concentration_counts = region_data['Concentration_Description'].value_counts()
    print(f"\n{region}:")
    for conc_type, count in concentration_counts.items():
        print(f"  {conc_type}: {count} locations")