'use client'

import Image from 'next/image'

interface ImageData {
  id: string
  url: string
  name: string
  uploadDate: string
  size: number
  type: string
}

interface ImageLibraryProps {
  images: ImageData[]
  selectedImages: string[]
  onImageSelect: (imageUrl: string) => void
  onDeleteImage?: (imageId: string, filename: string) => void
}

export default function ImageLibrary({ 
  images, 
  selectedImages, 
  onImageSelect,
  onDeleteImage 
}: ImageLibraryProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Image Library</h3>
        <p className="text-gray-600 mb-6">
          Select up to two images to compare. Click on images to select them for comparison.
        </p>
      </div>

      {images.length === 0 ? (
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload some satellite images to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const isSelected = selectedImages.includes(image.url)
            const canSelect = selectedImages.length < 2 || isSelected
            
            return (
              <div
                key={image.id}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : canSelect
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-gray-200 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (canSelect) {
                    onImageSelect(image.url)
                  }
                }}
              >
                <div className="aspect-square relative">
                  <Image
                    src={image.url}
                    alt={`Satellite image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                  {onDeleteImage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteImage(image.id, image.name)
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-900 font-medium truncate">
                    {image.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.size)} • {formatDate(image.uploadDate)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedImages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Selected Images ({selectedImages.length}/2)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {selectedImages.map((imageUrl, index) => {
              const imageData = images.find(img => img.url === imageUrl)
              return (
                <div key={index} className="relative">
                  <div className="aspect-video relative rounded-md overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={`Selected image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {imageData?.name || `Image ${index + 1}`}
                  </p>
                </div>
              )
            })}
          </div>
          {selectedImages.length === 2 && (
            <p className="text-sm text-blue-700 mt-3">
              Ready to compare! Switch to the &quot;Compare Images&quot; tab to analyze differences.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
