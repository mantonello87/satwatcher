import { NextResponse } from 'next/server'
import AzureBlobService from '@/lib/azure-blob'

export async function GET() {
  try {
    console.log('Fetching images from Azure Blob Storage...')
    
    const images = await AzureBlobService.listImages()
    
    console.log('Azure Blob Storage fetch successful, found', images.length, 'images')
    return NextResponse.json({ 
      images: images.map(img => ({
        id: img.name.split('.')[0], // Use filename without extension as ID
        url: img.url,
        name: img.metadata.filename || img.name,
        uploadDate: img.metadata.uploadDate,
        size: img.metadata.size,
        type: img.metadata.contentType
      })),
      storage: 'azure'
    })
  } catch (error) {
    console.error('Error fetching images from Azure Blob Storage:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch images from Azure Blob Storage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    console.log('Deleting image from Azure Blob Storage:', filename)
    await AzureBlobService.deleteImage(filename)
    console.log('Image deleted successfully from Azure Blob Storage:', filename)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image from Azure Blob Storage:', error)
    return NextResponse.json({ 
      error: 'Failed to delete image from Azure Blob Storage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
