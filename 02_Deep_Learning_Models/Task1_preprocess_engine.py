import os
import glob
import logging
import argparse
import numpy as np
import pandas as pd
import SimpleITK as sitk
from tqdm import tqdm
from sklearn.model_selection import train_test_split

# =============================================================================
# CONFIGURATION
# =============================================================================
RAW_DIR = os.path.join("data", "raw")
PROCESSED_DIR = os.path.join("data", "processed")
CLINICAL_CSV = "clinical.csv"
LOG_FILE = "preprocessing_errors.log"

# MNI Template (Must be present)
MNI_TEMPLATE = 'MNI152_T1_2mm.nii.gz'

# Target settings
TARGET_SHAPE = (128, 128, 128)
LABEL_MAP = {'CN': 0, 'MCI': 1, 'AD': 2}

# =============================================================================
# LOGGING SETUP
# =============================================================================
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.ERROR,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def resize_image_with_crop_or_pad(image, target_shape):
    """
    Resizes an image to target_shape by center cropping or padding.
    """
    input_shape = image.GetSize() # SimpleITK uses (x,y,z) order
    
    # Calculate crop/pad bounds
    lower_bound = []
    upper_bound = []
    
    for dim in range(3):
        diff = input_shape[dim] - target_shape[dim]
        if diff > 0: # Crop
            lower = diff // 2
            upper = diff - lower
            lower_bound.append(lower)
            upper_bound.append(upper)
        else: # Pad (handled separately or via resampling, but let's assume crop first)
            lower_bound.append(0)
            upper_bound.append(0)
            
    # Crop if needed
    if any(x > 0 for x in lower_bound + upper_bound):
        image = sitk.Crop(image, lower_bound, upper_bound)
        
    # Pad if needed
    final_size = image.GetSize()
    pad_lower = []
    pad_upper = []
    for dim in range(3):
        diff = target_shape[dim] - final_size[dim]
        if diff > 0:
            lower = diff // 2
            upper = diff - lower
            pad_lower.append(lower)
            pad_upper.append(upper)
        else:
            pad_lower.append(0)
            pad_upper.append(0)
            
    if any(x > 0 for x in pad_lower + pad_upper):
        image = sitk.ConstantPad(image, pad_lower, pad_upper, 0.0)
        
    return image

def simple_skull_strip(image):
    """
    Robust skull stripping using Otsu thresholding and morphological operations.
    Works on Windows without needing deep learning weights.
    """
    # 1. Otsu Thresholding to separate background
    otsu_filter = sitk.OtsuThresholdImageFilter()
    otsu_filter.SetInsideValue(0)
    otsu_filter.SetOutsideValue(1)
    binary_mask = otsu_filter.Execute(image)
    
    # 2. Fill holes (brain is a solid object)
    binary_mask = sitk.BinaryFillhole(binary_mask)
    
    # 3. Erosion to remove connection to skull/dura
    binary_mask = sitk.BinaryErode(binary_mask, [2]*image.GetDimension())
    
    # 4. Keep largest connected component (the brain)
    labeled_mask = sitk.ConnectedComponent(binary_mask)
    stats = sitk.LabelShapeStatisticsImageFilter()
    stats.Execute(labeled_mask)
    
    if stats.GetNumberOfLabels() > 0:
        # Find label with largest size
        largest_label = max(stats.GetLabels(), key=lambda l: stats.GetPhysicalSize(l))
        brain_mask = sitk.Equal(labeled_mask, largest_label)
    else:
        brain_mask = binary_mask

    # 5. Dilate back slightly to recover brain surface
    brain_mask = sitk.BinaryDilate(brain_mask, [2]*image.GetDimension())
    
    # Apply mask
    masked_image = sitk.Mask(image, brain_mask)
    return masked_image

def register_to_mni(image, template_path):
    """
    Register image to MNI template using Affine transformation.
    """
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"MNI Template not found at {template_path}")
        
    template = sitk.ReadImage(template_path, sitk.sitkFloat32)
    image = sitk.Cast(image, sitk.sitkFloat32)
    
    # Initialize transform using center of mass
    initial_transform = sitk.CenteredTransformInitializer(
        template, 
        image, 
        sitk.Euler3DTransform(), 
        sitk.CenteredTransformInitializerFilter.GEOMETRY
    )
    
    # Registration
    registration_method = sitk.ImageRegistrationMethod()
    registration_method.SetMetricAsMattesMutualInformation(numberOfHistogramBins=50)
    registration_method.SetMetricSamplingStrategy(registration_method.RANDOM)
    registration_method.SetMetricSamplingPercentage(0.01)
    registration_method.SetInterpolator(sitk.sitkLinear)
    registration_method.SetOptimizerAsGradientDescent(learningRate=1.0, numberOfIterations=100, convergenceMinimumValue=1e-6, convergenceWindowSize=10)
    registration_method.SetOptimizerScalesFromPhysicalShift()
    registration_method.SetInitialTransform(initial_transform, inPlace=False)
    
    try:
        final_transform = registration_method.Execute(template, image)
        
        # Resample image to match template space
        resampled_image = sitk.Resample(
            image, 
            template, 
            final_transform, 
            sitk.sitkLinear, 
            0.0, 
            image.GetPixelID()
        )
        return resampled_image
    except Exception as e:
        # Fallback if registration fails (rare with affine): just crop/pad to match
        print(f"Registration warning: {e}. Proceeding with raw resampling.")
        return sitk.Resample(image, template)

def segment_grey_matter(image):
    """
    Segment Grey Matter (GM) using K-Means/Otsu clustering logic.
    Assumes typically: CSF (dark), GM (gray), WM (white/bright).
    """
    # Smooth slightly before segmentation
    smooth = sitk.SmoothingRecursiveGaussian(image, sigma=1.0)
    
    # Otsu Multiple Thresholds (3 classes: Background/CSF, GM, WM)
    # This usually returns 0, 1, 2, 3 where 0 is background
    # We ideally want the middle intensity class for GM
    
    # Let's use simple K-Means via thresholds
    # Or simpler: Otsu to split Brain vs Not, then Otsu inside Brain?
    
    # Using simple 3-class segmentation
    num_classes = 3
    otsu = sitk.OtsuMultipleThresholdsImageFilter()
    otsu.SetNumberOfThresholds(num_classes)
    label_image = otsu.Execute(smooth)
    
    # Usually: 0=Background/CSF, 1=Grey Matter, 2=White Matter (sorted by intensity)
    # We return the label 1 (GM)
    gm_mask = sitk.Equal(label_image, 1) # Assumes GM is the middle intensity class
    gm_image = sitk.Mask(image, gm_mask)
    
    return gm_image

# =============================================================================
# CORE PROCESSING FUNCTION
# =============================================================================
def process_single_mri(input_path, template_path):
    """
    Full preprocessing pipeline for a single MRI using SimpleITK.
    """
    # Step 1: Load Image
    image = sitk.ReadImage(input_path, sitk.sitkFloat32)
    
    # Step 2: N4 Bias Field Correction
    # N4 needs a mask, usually fits Otsu mask
    mask_image = sitk.OtsuThreshold(image, 0, 1, 200)
    shrink_factor = 4
    input_image_downsampled = sitk.Shrink(image, [shrink_factor] * image.GetDimension())
    mask_image_downsampled = sitk.Shrink(mask_image, [shrink_factor] * image.GetDimension())
    bias_corrector = sitk.N4BiasFieldCorrectionImageFilter()
    bias_corrected_downsampled = bias_corrector.Execute(input_image_downsampled, mask_image_downsampled)
    log_bias_field = bias_corrector.GetLogBiasFieldAsImage(image)
    corrected_image = sitk.Exp(log_bias_field) * image
    
    # Step 3: Denoising (Curvature Flow)
    denoised_image = sitk.CurvatureFlow(corrected_image, timeStep=0.125, numberOfIterations=3)
    
    # Step 4: Skull Stripping (Brain Extraction)
    brain_only = simple_skull_strip(denoised_image)
    
    # Step 5: Registration to MNI
    try:
        registered_image = register_to_mni(brain_only, template_path)
    except Exception as e:
        # Fallback: Just valid brain extraction result
        logger.warning(f"Registration failed for {input_path}, using native space: {e}")
        registered_image = brain_only

    # Step 6: Tissue Segmentation (Extract GM)
    gm_volume = segment_grey_matter(registered_image)
    
    # Step 7: Intensity Normalization [0, 1]
    stats = sitk.StatisticsImageFilter()
    stats.Execute(gm_volume)
    min_val = stats.GetMinimum()
    max_val = stats.GetMaximum()
    
    if max_val - min_val > 1e-6:
        normalized_image = (gm_volume - min_val) / (max_val - min_val)
    else:
        normalized_image = gm_volume
        
    # Step 8: Resampling/Resizing to target shape
    # We register to Template which is already correct size usually? 
    # MNI 2mm is 91x109x91 usually not 128Cubed.
    # We explicitly resize to 128x128x128
    
    # Create a reference image 128^3
    new_size = TARGET_SHAPE
    new_spacing = [old_sz * old_spc / new_sz for old_sz, old_spc, new_sz in zip(registered_image.GetSize(), registered_image.GetSpacing(), new_size)]
    
    resampled_final = sitk.Resample(
        normalized_image,
        new_size,
        sitk.Transform(),
        sitk.sitkLinear,
        registered_image.GetOrigin(),
        new_spacing,
        registered_image.GetDirection(),
        0.0,
        normalized_image.GetPixelID()
    )
    
    return resampled_final

# =============================================================================
# MAIN EXECUTION
# =============================================================================
def main():
    print(f"Using SimpleITK version: {sitk.Version().VersionString()}")
    
    # 0. Directory Setup
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    if not os.path.exists(RAW_DIR):
        print(f"ERROR: Raw Data Directory '{RAW_DIR}' not found.")
        return

    # 1. Load Clinical Data
    if not os.path.exists(CLINICAL_CSV):
        print(f"ERROR: Clinical CSV '{CLINICAL_CSV}' not found.")
        return
        
    df = pd.read_csv(CLINICAL_CSV)
    
    # Map Labels
    try:
        df['label_code'] = df['label'].map(LABEL_MAP)
        if df['label_code'].isnull().any():
            invalid_rows = df[df['label_code'].isnull()]
            raise ValueError(f"Invalid labels found: {invalid_rows['label'].unique()}")
    except Exception as e:
        print(f"Error mapping labels: {e}")
        return

    print(f"Found {len(df)} subjects. Starting preprocessing...")
    
    processed_records = []

    # 2. Processing Loop
    for idx, row in tqdm(df.iterrows(), total=len(df), desc="Preprocessing"):
        subject_id = str(row['subject_id'])
        label = row['label_code']
        
        # Input/Output Paths
        input_filename = f"{subject_id}.nii.gz"
        input_path = os.path.join(RAW_DIR, input_filename)
        output_filename = f"{subject_id}_processed.nii.gz"
        output_path = os.path.join(PROCESSED_DIR, output_filename)
        
        # Check input exists
        if not os.path.exists(input_path):
            logging.error(f"Input file not found: {input_path}")
            continue
            
        try:
            # RUN PIPELINE
            final_image = process_single_mri(input_path, MNI_TEMPLATE)
            
            # CONSISTENCY & QUALITY CHECK (LIVE ACCURACY)
            # 1. Shape Check
            if final_image.GetSize() != TARGET_SHAPE:
                final_image = resize_image_with_crop_or_pad(final_image, TARGET_SHAPE)
                
            # 2. Alignment Score (Correlation with MNI Template)
            # Simplest proxy for "Registration Accuracy"
            template_img = sitk.ReadImage(MNI_TEMPLATE, sitk.sitkFloat32)
            # Resample template to match final image grid for comparison
            resampler = sitk.ResampleImageFilter()
            resampler.SetReferenceImage(final_image)
            template_resampled = resampler.Execute(template_img)
            
            # Normalized Cross Correlation (approximate alignment quality)
            # We use a quick correlation on the center slice to be fast
            z_center = final_image.GetSize()[2] // 2
            slice_final = sitk.GetArrayViewFromImage(final_image)[z_center, :, :]
            slice_template = sitk.GetArrayViewFromImage(template_resampled)[z_center, :, :]
            
            # Simple correlation (avoiding scipy for speed if possible, but let's use numpy)
            flat_final = slice_final.flatten()
            flat_template = slice_template.flatten()
            
            # SNR (Signal to Noise Ratio) Estimation
            # Signal = Mean of brain (foreground), Noise = Std of background
            # We can approximate with simple Otsu stats
            stats = sitk.StatisticsImageFilter()
            stats.Execute(final_image)
            snr = stats.GetMean() / (stats.GetSigma() + 1e-6)
            
            # Print Live "Accuracy" Metrics
            # We map correlation (-1 to 1) to a "Alignment Score" (0-100%)
            if len(flat_final) > 0 and np.std(flat_final) > 0:
                corr = np.corrcoef(flat_final, flat_template)[0, 1]
                align_score = max(0, corr) * 100
            else:
                align_score = 0.0
                
            tqdm.write(f"Subject {subject_id}: Alignment={align_score:.1f}% | SNR={snr:.2f} | QC: {'PASS' if align_score > 70 else 'WARN'}")
            
            # Save
            sitk.WriteImage(final_image, output_path)
            processed_records.append({'subject_id': subject_id, 'label': label, 'path': output_path})
            
        except Exception as e:
            logging.error(f"Failed to process {subject_id}: {str(e)}")
            continue

    # 3. Create Dataset Splits
    if not processed_records:
        print("No files processed successfully.")
        return
        
    df_processed = pd.DataFrame(processed_records)
    print(f"\nSuccessfully processed {len(df_processed)}/{len(df)} scans.")
    
    # Validation: Remove zero-variance images (empty black images)
    valid_indices = []
    for idx, row in df_processed.iterrows():
        try:
            im = sitk.ReadImage(row['path'])
            stats = sitk.StatisticsImageFilter()
            stats.Execute(im)
            if stats.GetMaximum() > 0:
                valid_indices.append(idx)
            else:
                logging.error(f"Image {row['subject_id']} is all zeros.")
        except:
            pass
            
    df_processed = df_processed.loc[valid_indices]
    
    # Split
    try:
        X = df_processed[['subject_id', 'path']]
        y = df_processed['label']
        
        # Train (70%) vs Temp (30%)
        X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)
        # Val (15%) vs Test (15%)
        X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42)
        
        # Save splits
        train_df = pd.concat([X_train, y_train], axis=1)
        val_df = pd.concat([X_val, y_val], axis=1)
        test_df = pd.concat([X_test, y_test], axis=1)
        
        train_df.to_csv('train.csv', index=False)
        val_df.to_csv('val.csv', index=False)
        test_df.to_csv('test.csv', index=False)
        
        print(f"\nSplits created:")
        print(f"Train: {len(train_df)}")
        print(f"Val:   {len(val_df)}")
        print(f"Test:  {len(test_df)}")
        
    except ValueError as e:
        print(f"Splitting failed (likely too few samples for stratification): {e}")

if __name__ == "__main__":
    main()
