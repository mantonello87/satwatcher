import { NextResponse } from 'next/server'
import AzureBlobService from '@/lib/azure-blob'

export async function GET() {
  try {
    console.log('=== Azure Blob Storage Test ===');
    
    // Test environment variables
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    
    console.log('Environment check:', {
      accountName: accountName ? `${accountName.slice(0, 5)}...` : 'MISSING',
      accountKey: accountKey ? 'PRESENT' : 'MISSING',
      containerName: containerName || 'MISSING'
    });
    
    if (!accountName || !accountKey || !containerName) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          accountName: accountName ? 'OK' : 'MISSING',
          accountKey: accountKey ? 'OK' : 'MISSING',
          containerName: containerName ? 'OK' : 'MISSING'
        }
      }, { status: 500 });
    }
    
    // Test container access
    console.log('Testing container operations...');
    await AzureBlobService.ensureContainerExists();
    console.log('Container test successful');
    
    // Test listing (should work even if empty)
    console.log('Testing list operation...');
    const images = await AzureBlobService.listImages();
    console.log(`List operation successful: found ${images.length} images`);
    
    return NextResponse.json({
      success: true,
      message: 'Azure Blob Storage is working correctly',
      imageCount: images.length,
      configuration: {
        accountName: accountName.slice(0, 5) + '...',
        containerName: containerName
      }
    });
    
  } catch (error) {
    console.error('Azure Blob Storage test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Azure Blob Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
