import pandas as pd
import numpy as np
import random

# Set random seed for reproducible results
np.random.seed(42)
random.seed(42)

# Load the existing dataset
df = pd.read_csv('public/vehicle_demo_data_enhanced.csv')

print(f"Original dataset size: {len(df)} rows")

# Define the desired distribution
desired_distribution = {
    0: 0.50,  # Highly Concentrated - 50%
    1: 0.30,  # Substantially Concentrated - 30%
    2: 0.20   # National - 20%
}

def redistribute_concentration_types(df, desired_dist):
    """
    Redistribute concentration types to match the desired distribution
    """
    total_rows = len(df)
    
    # Calculate target counts for each concentration type
    target_counts = {
        0: int(total_rows * desired_dist[0]),  # 50% highly concentrated
        1: int(total_rows * desired_dist[1]),  # 30% substantially concentrated
        2: int(total_rows * desired_dist[2])   # 20% national
    }
    
    # Adjust for rounding differences
    total_assigned = sum(target_counts.values())
    if total_assigned < total_rows:
        # Add remaining to highly concentrated
        target_counts[0] += (total_rows - total_assigned)
    
    print(f"Target distribution:")
    print(f"  Highly Concentrated (0): {target_counts[0]} rows ({target_counts[0]/total_rows*100:.1f}%)")
    print(f"  Substantially Concentrated (1): {target_counts[1]} rows ({target_counts[1]/total_rows*100:.1f}%)")
    print(f"  National (2): {target_counts[2]} rows ({target_counts[2]/total_rows*100:.1f}%)")
    
    # Create a list with the desired distribution
    concentration_assignment = []
    
    # Add the exact number of each type
    concentration_assignment.extend([0] * target_counts[0])  # Highly concentrated
    concentration_assignment.extend([1] * target_counts[1])  # Substantially concentrated  
    concentration_assignment.extend([2] * target_counts[2])  # National
    
    # Shuffle to randomize assignment
    random.shuffle(concentration_assignment)
    
    # Assign to dataframe
    df_copy = df.copy()
    df_copy['Concentration_Type'] = concentration_assignment
    
    # Update concentration descriptions
    concentration_map = {0: 'Highly Concentrated', 1: 'Substantially Concentrated', 2: 'National'}
    df_copy['Concentration_Description'] = df_copy['Concentration_Type'].map(concentration_map)
    
    return df_copy

# Apply the redistribution
df_redistributed = redistribute_concentration_types(df, desired_distribution)

# Verify the distribution
print(f"\nActual distribution after redistribution:")
concentration_counts = df_redistributed['Concentration_Type'].value_counts().sort_index()
total_rows = len(df_redistributed)

for conc_type, count in concentration_counts.items():
    conc_name = {0: 'Highly Concentrated', 1: 'Substantially Concentrated', 2: 'National'}[conc_type]
    percentage = (count / total_rows) * 100
    print(f"  {conc_name} ({conc_type}): {count} rows ({percentage:.1f}%)")

# Save the redistributed dataset
df_redistributed.to_csv('public/vehicle_demo_data_enhanced.csv', index=False)

print(f"\nDataset updated successfully!")
print(f"Total rows: {len(df_redistributed)}")

# Show distribution by vehicle class
print(f"\nConcentration distribution by Vehicle Class:")
for vehicle_class in sorted(df_redistributed['Vehicle_Class'].unique()):
    class_data = df_redistributed[df_redistributed['Vehicle_Class'] == vehicle_class]
    class_concentration_counts = class_data['Concentration_Type'].value_counts().sort_index()
    print(f"\nClass {vehicle_class} ({len(class_data)} rows):")
    for conc_type, count in class_concentration_counts.items():
        conc_name = {0: 'Highly Concentrated', 1: 'Substantially Concentrated', 2: 'National'}[conc_type]
        percentage = (count / len(class_data)) * 100
        print(f"  {conc_name}: {count} ({percentage:.1f}%)")

# Show distribution by region
print(f"\nConcentration distribution by Region:")
for region in sorted(df_redistributed['Region'].unique()):
    region_data = df_redistributed[df_redistributed['Region'] == region]
    region_concentration_counts = region_data['Concentration_Type'].value_counts().sort_index()
    print(f"\n{region} ({len(region_data)} rows):")
    for conc_type, count in region_concentration_counts.items():
        conc_name = {0: 'Highly Concentrated', 1: 'Substantially Concentrated', 2: 'National'}[conc_type]
        percentage = (count / len(region_data)) * 100
        print(f"  {conc_name}: {count} ({percentage:.1f}%)")

print("\nDataset enhancement completed with desired distribution!")