'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageComparisonProps {
  selectedImages: string[]
}

interface ComparisonResult {
  differences: {
    id: string
    description: string
    confidence: number
    category: string
    changeType?: string
    severity?: string
    location?: {
      x: number
      y: number
    }
  }[]
  summary: string
  changePercentage: number
  analysisMethod?: string
  modelConfidence?: number
  totalRegionsAnalyzed?: number
  changedRegions?: number
}

export default function ImageComparison({ selectedImages }: ImageComparisonProps) {
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState('')

  const handleCompare = async () => {
    if (selectedImages.length !== 2) {
      setError('Please select exactly 2 images to compare')
      return
    }

    setComparing(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image1: selectedImages[0],
          image2: selectedImages[1],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Comparison failed')
      }
    } catch (err) {
      console.error('Comparison error:', err)
      setError('Failed to compare images')
    } finally {
      setComparing(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vegetation':
        return 'bg-green-100 text-green-800'
      case 'infrastructure':
        return 'bg-blue-100 text-blue-800'
      case 'water':
        return 'bg-cyan-100 text-cyan-800'
      case 'urban':
        return 'bg-gray-100 text-gray-800'
      case 'natural':
        return 'bg-brown-100 text-brown-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Image Comparison</h3>
        <p className="text-gray-600 mb-6">
          Compare two satellite images to detect changes and differences using Azure Cognitive Services.
        </p>
      </div>

      {selectedImages.length !== 2 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Select 2 images to compare
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Go to the Image Library tab and select exactly 2 images for comparison.
          </p>
        </div>
      ) : (
        <>
          {/* Selected Images Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedImages.map((imageUrl, index) => (
              <div key={index} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Image {index + 1}
                </h4>
                <div className="aspect-video relative rounded-lg overflow-hidden border">
                  <Image
                    src={imageUrl}
                    alt={`Selected image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Compare Button */}
          <div className="text-center">
            <button
              onClick={handleCompare}
              disabled={comparing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {comparing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Images...
                </span>
              ) : (
                'Compare Images'
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="text-lg font-medium text-green-900 mb-2">
                  {result.analysisMethod || 'Custom Vision'} Analysis Complete
                </h4>
                <p className="text-green-700">{result.summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Change Detected:</span>
                    <p className="text-green-600">{(result.changePercentage * 100).toFixed(1)}%</p>
                  </div>
                  {result.modelConfidence && (
                    <div>
                      <span className="font-medium text-green-800">Model Confidence:</span>
                      <p className="text-green-600">{(result.modelConfidence * 100).toFixed(1)}%</p>
                    </div>
                  )}
                  {result.totalRegionsAnalyzed && (
                    <div>
                      <span className="font-medium text-green-800">Regions Analyzed:</span>
                      <p className="text-green-600">{result.totalRegionsAnalyzed}</p>
                    </div>
                  )}
                  {result.changedRegions && (
                    <div>
                      <span className="font-medium text-green-800">Changed Regions:</span>
                      <p className="text-green-600">{result.changedRegions}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Detected Changes ({result.differences.length})
                </h4>
                
                {result.differences.length === 0 ? (
                  <p className="text-gray-500">No significant differences detected between the images.</p>
                ) : (
                  <div className="space-y-4">
                    {result.differences.map((diff) => (
                      <div key={diff.id} className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2 flex-wrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(diff.category)}`}>
                                {diff.category}
                              </span>
                              {diff.severity && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(diff.severity)}`}>
                                  {diff.severity}
                                </span>
                              )}
                              {diff.changeType && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {diff.changeType}
                                </span>
                              )}
                              <span className={`text-sm font-medium ${getConfidenceColor(diff.confidence)}`}>
                                {(diff.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <p className="text-gray-900 mb-2">{diff.description}</p>
                            {diff.location && (
                              <p className="text-xs text-gray-500">
                                Location: ({diff.location.x}, {diff.location.y})
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
