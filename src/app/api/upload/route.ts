import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import AzureBlobService from '@/lib/azure-blob'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${fileExtension}`

    // Upload to Azure Blob Storage only
    console.log('Uploading to Azure Blob Storage:', filename)
    const blobUrl = await AzureBlobService.uploadImage(buffer, filename, file.type)
    
    console.log('Azure Blob Storage upload successful:', blobUrl)
    return NextResponse.json({ 
      url: blobUrl,
      filename: filename,
      size: file.size,
      type: file.type,
      storage: 'azure'
    })
  } catch (error) {
    console.error('Upload error:', error)
    
    // Log more specific error details
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
