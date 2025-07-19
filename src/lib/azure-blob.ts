import { BlobServiceClient, StorageSharedKeyCredential, ContainerClient, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

export interface BlobMetadata {
  filename: string;
  uploadDate: string;
  contentType: string;
  size: number;
}

export class AzureBlobService {
  private static getContainerClient(): ContainerClient {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

    console.log('Azure Storage Config Check:', {
      accountName: accountName ? `${accountName.slice(0, 5)}...` : 'MISSING',
      accountKey: accountKey ? 'PRESENT' : 'MISSING',
      containerName: containerName || 'MISSING',
      env: process.env.NODE_ENV
    });

    if (!accountName || !accountKey || !containerName) {
      const missing = [];
      if (!accountName) missing.push('AZURE_STORAGE_ACCOUNT_NAME');
      if (!accountKey) missing.push('AZURE_STORAGE_ACCOUNT_KEY');
      if (!containerName) missing.push('AZURE_STORAGE_CONTAINER_NAME');
      throw new Error(`Azure Blob Storage environment variables missing: ${missing.join(', ')}`);
    }

    try {
      const credential = new StorageSharedKeyCredential(accountName, accountKey);
      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential
      );
      return blobServiceClient.getContainerClient(containerName);
    } catch (error) {
      console.error('Error creating Azure Blob client:', error);
      throw new Error(`Failed to create Azure Blob client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async ensureContainerExists(): Promise<void> {
    try {
      const containerClient = this.getContainerClient();
      console.log('Checking if container exists...');
      
      // Check if container exists first
      const exists = await containerClient.exists();
      console.log(`Container exists: ${exists}`);
      
      if (!exists) {
        console.log('Creating container...');
        // Create container with private access (no public access required)
        const createResult = await containerClient.create({
          access: 'container'
        });
        console.log('Container created successfully:', createResult.requestId);
      }
      
      console.log('Container ready with private access');
    } catch (error) {
      console.error('Error in ensureContainerExists:', error);
      
      if (error instanceof Error) {
        console.error('Container error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      throw new Error(`Container operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static generateSasUrl(blobName: string): string {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;

    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Generate SAS token that expires in 24 hours
    const expiresOn = new Date();
    expiresOn.setHours(expiresOn.getHours() + 24);

    const sasOptions = {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"), // Read permission only
      expiresOn,
    };

    const sasToken = generateBlobSASQueryParameters(sasOptions, credential).toString();
    
    return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
  }

  static async uploadImage(
    buffer: Buffer, 
    filename: string, 
    contentType: string
  ): Promise<string> {
    try {
      console.log('Starting image upload:', filename);
      await this.ensureContainerExists();
      
      const containerClient = this.getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      
      const metadata: Record<string, string> = {
        filename,
        uploadDate: new Date().toISOString(),
        contentType,
        size: buffer.length.toString()
      };

      console.log('Uploading blob to Azure...');
      await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType
        },
        metadata: metadata
      });

      // Generate signed URL for private access
      const signedUrl = this.generateSasUrl(filename);
      console.log('Upload successful, generated signed URL');
      return signedUrl;
    } catch (error) {
      console.error('Error uploading to blob storage:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async listImages(): Promise<Array<{
    name: string;
    url: string;
    metadata: BlobMetadata;
    lastModified: Date;
  }>> {
    try {
      console.log('Starting listImages operation...');
      await this.ensureContainerExists();
      
      console.log('Container exists, getting client...');
      const containerClient = this.getContainerClient();
      const images = [];
      
      console.log('Starting to list blobs...');
      let blobCount = 0;
      
      for await (const blob of containerClient.listBlobsFlat({ includeMetadata: true })) {
        blobCount++;
        console.log(`Processing blob ${blobCount}: ${blob.name}, contentType: ${blob.properties.contentType}`);
        
        if (blob.properties.contentType?.startsWith('image/')) {
          const metadata: BlobMetadata = {
            filename: blob.metadata?.filename || blob.name,
            uploadDate: blob.metadata?.uploadDate || blob.properties.lastModified?.toISOString() || new Date().toISOString(),
            contentType: blob.metadata?.contentType || blob.properties.contentType || 'image/jpeg',
            size: parseInt(blob.metadata?.size || '0') || blob.properties.contentLength || 0
          };

          console.log(`Generating signed URL for: ${blob.name}`);
          // Generate signed URL for private access
          const signedUrl = this.generateSasUrl(blob.name);

          images.push({
            name: blob.name,
            url: signedUrl,
            metadata: metadata,
            lastModified: blob.properties.lastModified || new Date()
          });
          
          console.log(`Added image: ${blob.name}`);
        } else {
          console.log(`Skipping non-image blob: ${blob.name}`);
        }
      }

      console.log(`Found ${blobCount} total blobs, ${images.length} images`);

      // Sort by upload date (newest first)
      const sortedImages = images.sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      
      console.log('Images sorted successfully');
      return sortedImages;
    } catch (error) {
      console.error('Error in listImages:', error);
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      throw new Error(`Failed to list images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deleteImage(filename: string): Promise<void> {
    try {
      const containerClient = this.getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.error('Error deleting blob:', error);
      throw error;
    }
  }

  static async getImageBuffer(filename: string): Promise<Buffer> {
    try {
      const containerClient = this.getContainerClient();
      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      const downloadResponse = await blockBlobClient.download();
      
      if (!downloadResponse.readableStreamBody) {
        throw new Error('No readable stream body');
      }

      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        downloadResponse.readableStreamBody!.on('data', (chunk: any) => {
          chunks.push(chunk);
        });
        downloadResponse.readableStreamBody!.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        downloadResponse.readableStreamBody!.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading blob:', error);
      throw error;
    }
  }
}

export default AzureBlobService;
