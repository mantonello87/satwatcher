import { NextRequest, NextResponse } from 'next/server'
import { PredictionAPIClient } from '@azure/cognitiveservices-customvision-prediction'
import { ApiKeyCredentials } from '@azure/ms-rest-js'
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision'

// Environment variables for Custom Vision
const CUSTOM_VISION_PREDICTION_KEY = process.env.AZURE_CUSTOM_VISION_PREDICTION_KEY || 'your-custom-vision-prediction-key'
const CUSTOM_VISION_ENDPOINT = process.env.AZURE_CUSTOM_VISION_ENDPOINT || 'https://your-region.cognitiveservices.azure.com/'
const CUSTOM_VISION_PROJECT_ID = process.env.AZURE_CUSTOM_VISION_PROJECT_ID || 'your-project-id'
const CUSTOM_VISION_PUBLISHED_NAME = process.env.AZURE_CUSTOM_VISION_PUBLISHED_NAME || 'your-published-model-name'

// Computer Vision for general analysis (fallback)
const AZURE_VISION_KEY = process.env.AZURE_VISION_KEY || 'your-azure-vision-key'
const AZURE_VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT || 'https://your-region.cognitiveservices.azure.com/'

export async function POST(request: NextRequest) {
  try {
    const { image1, image2 } = await request.json()

    if (!image1 || !image2) {
      return NextResponse.json({ error: 'Two images are required' }, { status: 400 })
    }

    console.log('Environment check:', {
      hasCustomVisionKey: !!CUSTOM_VISION_PREDICTION_KEY && CUSTOM_VISION_PREDICTION_KEY !== 'your-custom-vision-prediction-key',
      endpoint: CUSTOM_VISION_ENDPOINT,
      projectId: CUSTOM_VISION_PROJECT_ID,
      publishedName: CUSTOM_VISION_PUBLISHED_NAME
    })

    // Check if Custom Vision is configured
    if (!CUSTOM_VISION_PREDICTION_KEY || CUSTOM_VISION_PREDICTION_KEY === 'your-custom-vision-prediction-key') {
      console.log('Custom Vision not configured, using mock analysis')
      // Fallback to mock analysis
      const mockResult = await simulateCustomVisionComparison(image1, image2)
      return NextResponse.json(mockResult)
    }

    // Convert relative URLs to full URLs for API calls
    const baseUrl = request.nextUrl.origin
    const fullImage1Url = image1.startsWith('http') ? image1 : `${baseUrl}${image1}`
    const fullImage2Url = image2.startsWith('http') ? image2 : `${baseUrl}${image2}`

    console.log('Processing images:', { fullImage1Url, fullImage2Url })

    // Use direct HTTP calls to Custom Vision API
    const [prediction1, prediction2] = await Promise.all([
      callCustomVisionAPI(fullImage1Url),
      callCustomVisionAPI(fullImage2Url)
    ])

    // Compare the predictions
    const comparisonResult = await compareCustomVisionResults(
      prediction1, 
      prediction2,
      fullImage1Url,
      fullImage2Url
    )
    
    return NextResponse.json(comparisonResult)
  } catch (error) {
    console.error('Custom Vision comparison error:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = {
      message: errorMessage,
      timestamp: new Date().toISOString(),
      environment: {
        hasCustomVisionKey: !!CUSTOM_VISION_PREDICTION_KEY,
        endpoint: CUSTOM_VISION_ENDPOINT,
        projectId: CUSTOM_VISION_PROJECT_ID,
        publishedName: CUSTOM_VISION_PUBLISHED_NAME
      }
    }
    
    return NextResponse.json({ 
      error: 'Comparison failed', 
      details: errorDetails 
    }, { status: 500 })
  }
}

// Direct HTTP call to Custom Vision API optimized for detection model
async function callCustomVisionAPI(imageUrl: string) {
  // Ensure endpoint has trailing slash
  const endpoint = CUSTOM_VISION_ENDPOINT.endsWith('/') ? CUSTOM_VISION_ENDPOINT : `${CUSTOM_VISION_ENDPOINT}/`
  
  // Try detection first since we know this is a detection model
  try {
    console.log('Calling Custom Vision API (Detection - Primary)...')
    return await callCustomVisionDetectionAPI(imageUrl)
  } catch (error) {
    console.error('Custom Vision detection API call failed:', error)
    
    // Try classification as fallback (though we know this will fail)
    try {
      console.log('Trying classification API as fallback...')
      const customVisionUrl = `${endpoint}customvision/v3.0/Prediction/${CUSTOM_VISION_PROJECT_ID}/classify/iterations/${CUSTOM_VISION_PUBLISHED_NAME}/url`
      
      console.log('Calling Custom Vision API (Classification):', customVisionUrl)
      console.log('Image URL:', imageUrl)
      console.log('Using prediction key:', CUSTOM_VISION_PREDICTION_KEY ? 'Present' : 'Missing')
      
      const response = await fetch(customVisionUrl, {
        method: 'POST',
        headers: {
          'Prediction-Key': CUSTOM_VISION_PREDICTION_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Url: imageUrl })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Custom Vision Classification Error:', response.status, response.statusText, errorText)
        throw new Error(`Custom Vision API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Custom Vision Classification Response:', result)
      return result
    } catch (classificationError) {
      console.error('Classification API also failed:', classificationError)
      
      // Final fallback: try binary upload
      try {
        console.log('Trying binary upload method...')
        return await callCustomVisionAPIWithBinary(imageUrl)
      } catch (binaryError) {
        console.error('Binary upload also failed:', binaryError)
        throw error // Throw original detection error
      }
    }
  }
}

// Detection API call
async function callCustomVisionDetectionAPI(imageUrl: string) {
  const endpoint = CUSTOM_VISION_ENDPOINT.endsWith('/') ? CUSTOM_VISION_ENDPOINT : `${CUSTOM_VISION_ENDPOINT}/`
  const customVisionUrl = `${endpoint}customvision/v3.0/Prediction/${CUSTOM_VISION_PROJECT_ID}/detect/iterations/${CUSTOM_VISION_PUBLISHED_NAME}/url`
  
  console.log('Calling Custom Vision API (Detection):', customVisionUrl)
  
  const response = await fetch(customVisionUrl, {
    method: 'POST',
    headers: {
      'Prediction-Key': CUSTOM_VISION_PREDICTION_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ Url: imageUrl })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Custom Vision Detection API Error:', response.status, response.statusText, errorText)
    throw new Error(`Custom Vision Detection API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const result = await response.json()
  console.log('Custom Vision Detection API Response:', result)
  return result
}

// Alternative method: Download image and send as binary data
async function callCustomVisionAPIWithBinary(imageUrl: string) {
  // Ensure endpoint has trailing slash
  const endpoint = CUSTOM_VISION_ENDPOINT.endsWith('/') ? CUSTOM_VISION_ENDPOINT : `${CUSTOM_VISION_ENDPOINT}/`
  
  // Try classification first
  let customVisionUrl = `${endpoint}customvision/v3.0/Prediction/${CUSTOM_VISION_PROJECT_ID}/classify/iterations/${CUSTOM_VISION_PUBLISHED_NAME}/image`
  
  // Fetch the image
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`)
  }
  
  const imageBuffer = await imageResponse.arrayBuffer()
  
  try {
    console.log('Trying binary classification upload:', customVisionUrl)
    
    const response = await fetch(customVisionUrl, {
      method: 'POST',
      headers: {
        'Prediction-Key': CUSTOM_VISION_PREDICTION_KEY,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBuffer
    })

    if (!response.ok) {
      // If classification fails, try detection
      if (response.status === 404) {
        console.log('Binary classification endpoint not found, trying detection...')
        customVisionUrl = `${endpoint}customvision/v3.0/Prediction/${CUSTOM_VISION_PROJECT_ID}/detect/iterations/${CUSTOM_VISION_PUBLISHED_NAME}/image`
        
        const detectionResponse = await fetch(customVisionUrl, {
          method: 'POST',
          headers: {
            'Prediction-Key': CUSTOM_VISION_PREDICTION_KEY,
            'Content-Type': 'application/octet-stream'
          },
          body: imageBuffer
        })
        
        if (!detectionResponse.ok) {
          const errorText = await detectionResponse.text()
          console.error('Custom Vision Binary Detection API Error:', detectionResponse.status, detectionResponse.statusText, errorText)
          throw new Error(`Custom Vision Binary Detection API error: ${detectionResponse.status} ${detectionResponse.statusText}`)
        }
        
        return await detectionResponse.json()
      }
      
      const errorText = await response.text()
      console.error('Custom Vision Binary API Error:', response.status, response.statusText, errorText)
      throw new Error(`Custom Vision Binary API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Binary Custom Vision API call failed:', error)
    throw error
  }
}

// Mock Custom Vision analysis for demo
async function simulateCustomVisionComparison(image1: string, image2: string) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 3000))

  const mockDifferences = [
    {
      id: '1',
      description: 'Urban development expansion detected - new residential area identified',
      confidence: 0.92,
      category: 'Urban Development',
      location: { x: 180, y: 220 },
      changeType: 'Addition',
      severity: 'High'
    },
    {
      id: '2',
      description: 'Forest area reduction observed - deforestation activity',
      confidence: 0.87,
      category: 'Vegetation Loss',
      location: { x: 120, y: 150 },
      changeType: 'Removal',
      severity: 'Critical'
    },
    {
      id: '3',
      description: 'New transportation infrastructure - road construction',
      confidence: 0.79,
      category: 'Infrastructure',
      location: { x: 250, y: 190 },
      changeType: 'Addition',
      severity: 'Medium'
    },
    {
      id: '4',
      description: 'Water body expansion - seasonal flooding detected',
      confidence: 0.84,
      category: 'Water Bodies',
      location: { x: 320, y: 110 },
      changeType: 'Expansion',
      severity: 'Medium'
    },
    {
      id: '5',
      description: 'Agricultural land conversion to industrial use',
      confidence: 0.76,
      category: 'Land Use Change',
      location: { x: 200, y: 280 },
      changeType: 'Conversion',
      severity: 'High'
    }
  ]

  return {
    differences: mockDifferences,
    summary: `Custom Vision model analysis complete. Detected ${mockDifferences.length} significant changes between satellite images, with focus on urban development, vegetation changes, and infrastructure modifications.`,
    changePercentage: 0.23, // 23% of analyzed area shows changes
    analysisMethod: 'Custom Vision Model',
    modelConfidence: 0.85,
    totalRegionsAnalyzed: 15,
    changedRegions: mockDifferences.length
  }
}

// Compare Custom Vision prediction results with enhanced spatial analysis
async function compareCustomVisionResults(
  prediction1: any, 
  prediction2: any, 
  image1Url?: string,
  image2Url?: string
) {
  const differences: any[] = []
  let changePercentage = 0

  // Get predictions from both images
  const predictions1 = prediction1.predictions || []
  const predictions2 = prediction2.predictions || []

  console.log('Custom Vision Results:', { 
    image1_predictions: predictions1.length,
    image2_predictions: predictions2.length,
    predictions1, 
    predictions2 
  })

  // Filter predictions by confidence threshold (>= 10% to catch more detections)
  const filteredPreds1 = predictions1.filter((pred: any) => pred.probability >= 0.1)
  const filteredPreds2 = predictions2.filter((pred: any) => pred.probability >= 0.1)

  // Count detections by tag
  const counts1 = new Map<string, number>()
  const counts2 = new Map<string, number>()
  const highConfPreds1 = new Map<string, any[]>()
  const highConfPreds2 = new Map<string, any[]>()

  filteredPreds1.forEach((pred: any) => {
    counts1.set(pred.tagName, (counts1.get(pred.tagName) || 0) + 1)
    if (!highConfPreds1.has(pred.tagName)) highConfPreds1.set(pred.tagName, [])
    highConfPreds1.get(pred.tagName)!.push(pred)
  })

  filteredPreds2.forEach((pred: any) => {
    counts2.set(pred.tagName, (counts2.get(pred.tagName) || 0) + 1)
    if (!highConfPreds2.has(pred.tagName)) highConfPreds2.set(pred.tagName, [])
    highConfPreds2.get(pred.tagName)!.push(pred)
  })

  // Find all unique tags
  const allTags = new Set<string>([
    ...Array.from(counts1.keys()), 
    ...Array.from(counts2.keys())
  ])

  console.log('Detection counts:', { 
    image1: Object.fromEntries(counts1), 
    image2: Object.fromEntries(counts2) 
  })

  // Compare detection counts and confidence levels
  allTags.forEach(tag => {
    const count1 = counts1.get(tag) || 0
    const count2 = counts2.get(tag) || 0
    const preds1 = highConfPreds1.get(tag) || []
    const preds2 = highConfPreds2.get(tag) || []

    // Calculate average confidence for each tag
    const avgConf1 = preds1.length > 0 ? preds1.reduce((sum, p) => sum + p.probability, 0) / preds1.length : 0
    const avgConf2 = preds2.length > 0 ? preds2.reduce((sum, p) => sum + p.probability, 0) / preds2.length : 0

    // Check for count differences
    const countDiff = Math.abs(count2 - count1)
    if (countDiff > 0) {
      const changeType = count2 > count1 ? 'Increase' : 'Decrease'
      const severity = countDiff >= 3 ? 'High' : countDiff >= 2 ? 'Medium' : 'Low'
      
      differences.push({
        id: `count-${tag}-${Date.now()}`,
        description: `${changeType} in ${tag} detections: ${count1} → ${count2} (${countDiff > 0 ? '+' : ''}${count2 - count1})`,
        confidence: Math.max(avgConf1, avgConf2),
        category: categorizePrediction(tag),
        changeType: changeType,
        severity: severity,
        location: preds2.length > 0 && preds2[0].boundingBox ? {
          x: Math.round(preds2[0].boundingBox.left * 400),
          y: Math.round(preds2[0].boundingBox.top * 300)
        } : undefined,
        details: {
          image1Count: count1,
          image2Count: count2,
          avgConfidence1: avgConf1,
          avgConfidence2: avgConf2
        }
      })
    }

    // Check for confidence changes (lowered threshold to 10%)
    if (count1 > 0 && count2 > 0) {
      const confidenceDiff = Math.abs(avgConf2 - avgConf1)
      if (confidenceDiff > 0.1) { // 10% threshold for confidence changes
        const changeType = avgConf2 > avgConf1 ? 'Increase' : 'Decrease'
        const severity = confidenceDiff > 0.3 ? 'High' : confidenceDiff > 0.2 ? 'Medium' : 'Low'
        
        differences.push({
          id: `confidence-${tag}-${Date.now()}`,
          description: `${changeType} in ${tag} detection confidence: ${(confidenceDiff * 100).toFixed(1)}% change`,
          confidence: Math.max(avgConf1, avgConf2),
          category: categorizePrediction(tag),
          changeType: `Confidence ${changeType}`,
          severity: severity,
          location: preds2.length > 0 && preds2[0].boundingBox ? {
            x: Math.round(preds2[0].boundingBox.left * 400),
            y: Math.round(preds2[0].boundingBox.top * 300)
          } : undefined,
          details: {
            avgConfidence1: avgConf1,
            avgConfidence2: avgConf2,
            confidenceChange: confidenceDiff
          }
        })
      }
    }
  })

  // Add spatial distribution analysis
  const spatialAnalysis = analyzeSpatialDistribution(filteredPreds1, filteredPreds2)
  if (spatialAnalysis.hasSignificantChange) {
    differences.push({
      id: `spatial-change-${Date.now()}`,
      description: spatialAnalysis.description,
      confidence: spatialAnalysis.confidence,
      category: 'Spatial Distribution',
      changeType: 'Spatial Shift',
      severity: spatialAnalysis.severity,
      details: spatialAnalysis.details
    })
  }

  // Calculate overall change percentage based on multiple factors
  const totalPreds1 = filteredPreds1.length
  const totalPreds2 = filteredPreds2.length
  const countChangeRatio = totalPreds1 > 0 ? Math.abs(totalPreds2 - totalPreds1) / totalPreds1 : (totalPreds2 > 0 ? 1 : 0)
  const significanceScore = differences.length * 0.15 // 15% per significant difference
  changePercentage = Math.min(Math.max(countChangeRatio, significanceScore), 1)

  const averageConfidence = differences.length > 0 
    ? differences.reduce((sum, diff) => sum + diff.confidence, 0) / differences.length 
    : 0

  const summary = differences.length > 0 
    ? `Custom Vision detected ${differences.length} significant changes between the images. Found ${totalPreds1} detections in image 1 vs ${totalPreds2} in image 2.`
    : `Custom Vision found ${totalPreds1} detections in image 1 and ${totalPreds2} in image 2, but no significant differences were detected.`

  return {
    differences,
    summary,
    changePercentage,
    analysisMethod: 'Enhanced Custom Vision Object Detection',
    modelConfidence: averageConfidence,
    totalRegionsAnalyzed: Math.max(totalPreds1, totalPreds2),
    changedRegions: differences.length,
    detectionCounts: {
      image1: totalPreds1,
      image2: totalPreds2,
      byTag1: Object.fromEntries(counts1),
      byTag2: Object.fromEntries(counts2)
    }
  }
}

// Analyze spatial distribution of detections
function analyzeSpatialDistribution(preds1: any[], preds2: any[]) {
  // Calculate center of mass for each image
  const getCenterOfMass = (predictions: any[]) => {
    if (predictions.length === 0) return { x: 0, y: 0 }
    
    const validPreds = predictions.filter(p => p.boundingBox)
    if (validPreds.length === 0) return { x: 0, y: 0 }
    
    const totalX = validPreds.reduce((sum, p) => sum + (p.boundingBox.left + p.boundingBox.width / 2), 0)
    const totalY = validPreds.reduce((sum, p) => sum + (p.boundingBox.top + p.boundingBox.height / 2), 0)
    
    return {
      x: totalX / validPreds.length,
      y: totalY / validPreds.length
    }
  }

  const center1 = getCenterOfMass(preds1)
  const center2 = getCenterOfMass(preds2)
  
  const spatialShift = Math.sqrt(
    Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
  )
  
  const hasSignificantChange = spatialShift > 0.1 // 10% shift threshold
  
  return {
    hasSignificantChange,
    description: hasSignificantChange 
      ? `Spatial distribution shift detected: ${(spatialShift * 100).toFixed(1)}% change in detection center`
      : 'No significant spatial distribution change',
    confidence: Math.min(spatialShift * 2, 1), // Scale to 0-1
    severity: spatialShift > 0.3 ? 'High' : spatialShift > 0.2 ? 'Medium' : 'Low',
    details: {
      spatialShift,
      center1,
      center2
    }
  }
}

function categorizePrediction(tagName: string): string {
  const categories: { [key: string]: string } = {
    // Common satellite imagery categories
    'urban': 'Urban Development',
    'building': 'Infrastructure',
    'road': 'Transportation',
    'forest': 'Vegetation',
    'vegetation': 'Vegetation',
    'water': 'Water Bodies',
    'agricultural': 'Agriculture',
    'industrial': 'Industrial',
    'residential': 'Urban Development',
    'commercial': 'Urban Development',
    'deforestation': 'Environmental Change',
    'deforest': 'Environmental Change',
    'construction': 'Infrastructure Development'
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(categories)) {
    if (tagName.toLowerCase().includes(key)) {
      return value
    }
  }
  
  return 'Other'
}
