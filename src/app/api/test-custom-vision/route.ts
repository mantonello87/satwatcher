import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test environment variables
    const config = {
      hasCustomVisionKey: !!process.env.AZURE_CUSTOM_VISION_PREDICTION_KEY,
      endpoint: process.env.AZURE_CUSTOM_VISION_ENDPOINT,
      projectId: process.env.AZURE_CUSTOM_VISION_PROJECT_ID,
      publishedName: process.env.AZURE_CUSTOM_VISION_PUBLISHED_NAME,
      keyLength: process.env.AZURE_CUSTOM_VISION_PREDICTION_KEY?.length || 0
    }

    console.log('Custom Vision Config Test:', config)

    // Test API call with a simple URL
    const endpoint = process.env.AZURE_CUSTOM_VISION_ENDPOINT?.endsWith('/') 
      ? process.env.AZURE_CUSTOM_VISION_ENDPOINT 
      : `${process.env.AZURE_CUSTOM_VISION_ENDPOINT}/`
    
    const classifyUrl = `${endpoint}customvision/v3.0/Prediction/${process.env.AZURE_CUSTOM_VISION_PROJECT_ID}/classify/iterations/${process.env.AZURE_CUSTOM_VISION_PUBLISHED_NAME}/url`
    const detectUrl = `${endpoint}customvision/v3.0/Prediction/${process.env.AZURE_CUSTOM_VISION_PROJECT_ID}/detect/iterations/${process.env.AZURE_CUSTOM_VISION_PUBLISHED_NAME}/url`

    const testImageUrl = "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400"

    // Test classification endpoint
    let classifyResult = null
    let classifyError = null
    try {
      const classifyResponse = await fetch(classifyUrl, {
        method: 'POST',
        headers: {
          'Prediction-Key': process.env.AZURE_CUSTOM_VISION_PREDICTION_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Url: testImageUrl })
      })
      
      if (classifyResponse.ok) {
        classifyResult = await classifyResponse.json()
      } else {
        classifyError = {
          status: classifyResponse.status,
          statusText: classifyResponse.statusText,
          text: await classifyResponse.text()
        }
      }
    } catch (error) {
      classifyError = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test detection endpoint
    let detectResult = null
    let detectError = null
    try {
      const detectResponse = await fetch(detectUrl, {
        method: 'POST',
        headers: {
          'Prediction-Key': process.env.AZURE_CUSTOM_VISION_PREDICTION_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Url: testImageUrl })
      })
      
      if (detectResponse.ok) {
        detectResult = await detectResponse.json()
      } else {
        detectError = {
          status: detectResponse.status,
          statusText: detectResponse.statusText,
          text: await detectResponse.text()
        }
      }
    } catch (error) {
      detectError = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json({
      success: true,
      config,
      endpoints: {
        classify: classifyUrl,
        detect: detectUrl
      },
      results: {
        classify: {
          success: !!classifyResult,
          result: classifyResult,
          error: classifyError
        },
        detect: {
          success: !!detectResult,
          result: detectResult,
          error: detectError
        }
      }
    })

  } catch (error) {
    console.error('Custom Vision test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
