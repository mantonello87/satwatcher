<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# SatWatcher - Satellite Image Comparison Application

This is a Next.js application built with TypeScript that allows users to upload, manage, and compare satellite images using Azure Cognitive Services.

## Key Features
- User authentication with NextAuth.js
- Image upload and library management
- Azure Cognitive Services integration for image analysis
- Side-by-side image comparison with detailed difference detection
- Responsive design with Tailwind CSS

## Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Cloud Services**: Azure Cognitive Services (Computer Vision API)
- **File Handling**: Node.js fs/promises for image uploads

## Development Guidelines
1. Use TypeScript with strict mode enabled
2. Follow Next.js App Router conventions
3. Implement proper error handling for API routes
4. Use Tailwind CSS for consistent styling
5. Ensure responsive design for mobile devices
6. Validate user inputs and file uploads
7. Handle loading states and user feedback

## Azure Integration
- Use Azure Computer Vision API for image analysis
- Implement proper error handling for API failures
- Consider rate limiting and cost optimization
- Store Azure credentials securely in environment variables

## Authentication
- Demo credentials: demo@example.com / demo123
- Extend with proper user registration in production
- Implement session management and route protection
