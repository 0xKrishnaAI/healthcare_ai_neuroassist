#!/usr/bin/env python3
"""
DICOM to NIfTI Converter for ADNI Dataset
==========================================
Converts ADNI DICOM files to .nii.gz format ready for preprocessing.

This script:
1. Reads MRI_metadata.csv to get subject labels
2. Converts DICOM folders to NIfTI using dicom2nifti
3. Creates clinical.csv with subject IDs and labels
4. Organizes output for preprocess_engine.py

Usage:
    pip install dicom2nifti pydicom
    python convert_dicom_to_nifti.py
"""

import os
import sys
import pandas as pd
from pathlib import Path
from tqdm import tqdm
import shutil

# Add dicom2nifti requirement
try:
    import dicom2nifti
    import dicom2nifti.settings as settings
    settings.disable_validate_slice_increment()
    settings.disable_validate_orthogonal()
    settings.disable_validate_slicecount()
except ImportError:
    print("Please install dicom2nifti: pip install dicom2nifti")
    sys.exit(1)

# Configuration
METADATA_CSV = 'data/raw/MRI_metadata.csv'
DICOM_ROOT = 'data/raw/MRI_extracted/MRI'
OUTPUT_DIR = 'data/raw'
CLINICAL_OUTPUT = 'clinical.csv'

def find_dicom_folder(subject_dir):
    """Recursively find a folder containing DICOM files."""
    for root, dirs, files in os.walk(subject_dir):
        dcm_files = [f for f in files if f.endswith('.dcm') or f.endswith('.DCM') or 
                     (not f.startswith('.') and '.' not in f)]
        if dcm_files:
            return root
    return None

def convert_subject(subject_id, subject_dir, output_path):
    """Convert a single subject's DICOM to NIfTI."""
    try:
        # Find DICOM folder
        dicom_folder = find_dicom_folder(subject_dir)
        if not dicom_folder:
            return False, "No DICOM files found"
        
        # Create temp output path
        temp_output = output_path.replace('.nii.gz', '_temp')
        os.makedirs(temp_output, exist_ok=True)
        
        # Convert DICOM to NIfTI
        dicom2nifti.convert_directory(dicom_folder, temp_output, compression=True, reorient=True)
        
        # Find the output file and rename
        nifti_files = list(Path(temp_output).glob('*.nii.gz'))
        if nifti_files:
            shutil.move(str(nifti_files[0]), output_path)
            shutil.rmtree(temp_output)
            return True, "Success"
        else:
            shutil.rmtree(temp_output)
            return False, "No NIfTI output"
            
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("DICOM to NIfTI Converter for ADNI Dataset")
    print("=" * 60)
    
    # Load metadata
    print(f"\nLoading metadata from: {METADATA_CSV}")
    metadata = pd.read_csv(METADATA_CSV)
    
    # Get unique subjects with their labels
    # Take first occurrence of each subject for label
    subjects_df = metadata.drop_duplicates(subset=['Subject'], keep='first')[['Subject', 'Group']]
    subjects_df = subjects_df.rename(columns={'Subject': 'subject_id', 'Group': 'label'})
    
    print(f"Total unique subjects: {len(subjects_df)}")
    print(f"\nLabel distribution:")
    print(subjects_df['label'].value_counts())
    
    # Convert each subject
    print(f"\n{'=' * 60}")
    print("Converting DICOM to NIfTI")
    print(f"{'=' * 60}\n")
    
    results = []
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for _, row in tqdm(subjects_df.iterrows(), total=len(subjects_df), desc="Converting"):
        subject_id = row['subject_id']
        label = row['label']
        
        subject_dir = os.path.join(DICOM_ROOT, subject_id)
        output_path = os.path.join(OUTPUT_DIR, f"{subject_id}.nii.gz")
        
        # Skip if already converted
        if os.path.exists(output_path):
            results.append({
                'subject_id': subject_id,
                'label': label,
                'converted': True,
                'status': 'Already exists'
            })
            continue
        
        # Skip if source doesn't exist
        if not os.path.exists(subject_dir):
            results.append({
                'subject_id': subject_id,
                'label': label,
                'converted': False,
                'status': 'Source not found'
            })
            continue
        
        # Convert
        success, status = convert_subject(subject_id, subject_dir, output_path)
        results.append({
            'subject_id': subject_id,
            'label': label,
            'converted': success,
            'status': status
        })
    
    # Create results dataframe
    results_df = pd.DataFrame(results)
    
    # Summary
    print(f"\n{'=' * 60}")
    print("Conversion Summary")
    print(f"{'=' * 60}")
    print(f"Successfully converted: {results_df['converted'].sum()}")
    print(f"Failed: {(~results_df['converted']).sum()}")
    
    # Create clinical.csv with only successful conversions
    successful = results_df[results_df['converted']][['subject_id', 'label']]
    successful.to_csv(CLINICAL_OUTPUT, index=False)
    print(f"\nSaved {CLINICAL_OUTPUT} with {len(successful)} subjects")
    
    print(f"\nLabel distribution in clinical.csv:")
    print(successful['label'].value_counts())
    
    print(f"\n{'=' * 60}")
    print("CONVERSION COMPLETE")
    print(f"{'=' * 60}")
    print(f"\nNext step: Run 'python preprocess_engine.py' to preprocess the data")

if __name__ == '__main__':
    main()
