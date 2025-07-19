'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import ImageUpload from '@/components/ImageUpload'
import ImageLibrary from '@/components/ImageLibrary'
import ImageComparison from '@/components/ImageComparison'
import Header from '@/components/Header'

interface ImageData {
  id: string
  url: string
  name: string
  uploadDate: string
  size: number
  type: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<ImageData[]>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'compare'>('upload')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch images from Azure Blob Storage
  const fetchImages = async () => {
    try {
      setLoading(true)
      console.log('Fetching images from Azure Blob Storage...')
      
      const response = await fetch('/api/images')
      if (response.ok) {
        const data = await response.json()
        console.log('Images fetched successfully:', data.images.length, 'images')
        setUploadedImages(data.images || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch images from Azure Blob Storage:', response.status, errorData)
        setUploadedImages([]) // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching images from Azure Blob Storage:', error)
      setUploadedImages([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Fetch images on component mount
  useEffect(() => {
    if (session) {
      fetchImages()
    }
  }, [session])

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  const handleImageSelect = (imageUrl: string) => {
    if (selectedImages.includes(imageUrl)) {
      setSelectedImages(selectedImages.filter(img => img !== imageUrl))
    } else if (selectedImages.length < 2) {
      setSelectedImages([...selectedImages, imageUrl])
    }
  }

  const handleImageUpload = (imageUrl: string) => {
    // Refresh the image list after upload
    fetchImages()
  }

  const handleDeleteImage = async (imageId: string, filename: string) => {
    try {
      const response = await fetch(`/api/images?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove from local state
        setUploadedImages(uploadedImages.filter(img => img.id !== imageId))
        // Remove from selected images if it was selected
        const deletedImage = uploadedImages.find(img => img.id === imageId)
        if (deletedImage && selectedImages.includes(deletedImage.url)) {
          setSelectedImages(selectedImages.filter(url => url !== deletedImage.url))
        }
      } else {
        console.error('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Satellite Image Analysis Dashboard
          </h1>
          <p className="text-gray-600">
            Upload, select, and compare satellite images to detect changes over time.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Images
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'library'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Image Library
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'compare'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Compare Images ({selectedImages.length}/2)
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'upload' && (
            <ImageUpload onUpload={handleImageUpload} />
          )}
          
          {activeTab === 'library' && (
            <div>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading images...</p>
                </div>
              ) : (
                <ImageLibrary
                  images={uploadedImages}
                  selectedImages={selectedImages}
                  onImageSelect={handleImageSelect}
                  onDeleteImage={handleDeleteImage}
                />
              )}
            </div>
          )}
          
          {activeTab === 'compare' && (
            <ImageComparison selectedImages={selectedImages} />
          )}
        </div>
      </main>
    </div>
  )
}
