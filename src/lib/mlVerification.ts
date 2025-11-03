import { pipeline } from '@huggingface/transformers';

export interface MLVerificationResult {
  isPothole: boolean;
  confidence: number;
  classification: string;
  alternatives: Array<{ label: string; score: number }>;
  model: string;
  verifiedAt: string;
}

let classifier: any = null;

// Initialize the image classification model
async function initializeModel() {
  if (!classifier) {
    console.log('Loading ML model...');
    try {
      // Using MobileNet for efficient browser-based image classification
      classifier = await pipeline(
        'image-classification',
        'Xenova/vit-base-patch16-224'
      );
      console.log('ML model loaded successfully');
    } catch (error) {
      console.error('Failed to load ML model:', error);
      throw new Error('Failed to initialize ML model');
    }
  }
  return classifier;
}

// Verify if an image contains a pothole or road issue
export async function verifyPotholeImage(imageFile: File): Promise<MLVerificationResult> {
  try {
    const model = await initializeModel();
    
    // Create image URL for processing
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Run classification
    const results = await model(imageUrl);
    
    // Clean up URL
    URL.revokeObjectURL(imageUrl);
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new Error('No classification results returned');
    }

    // Keywords that suggest road issues/potholes
    const potholeKeywords = [
      'pothole', 'hole', 'crack', 'damage', 'road', 'asphalt', 
      'pavement', 'concrete', 'street', 'highway', 'construction',
      'crater', 'depression', 'defect', 'deterioration'
    ];

    // Check if any classification matches pothole-related keywords
    const topResult = results[0];
    const isPothole = results.some((result: any) => 
      potholeKeywords.some(keyword => 
        result.label.toLowerCase().includes(keyword)
      )
    );

    const confidence = isPothole 
      ? results.find((r: any) => 
          potholeKeywords.some(k => r.label.toLowerCase().includes(k))
        )?.score || topResult.score
      : topResult.score;

    return {
      isPothole,
      confidence: Math.round(confidence * 100) / 100,
      classification: topResult.label,
      alternatives: results.slice(0, 5).map((r: any) => ({
        label: r.label,
        score: Math.round(r.score * 100) / 100
      })),
      model: 'vit-base-patch16-224',
      verifiedAt: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('ML verification error:', error);
    throw new Error(`Verification failed: ${error.message}`);
  }
}
