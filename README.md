# SatWatcher - Satellite Image Comparison Application

A modern web application built with Next.js that allows users to upload, manage, and compare satellite images using Azure Cognitive Services for advanced image analysis and change detection.

## Features

### 🔐 User Authentication
- Secure login system with NextAuth.js
- Demo credentials available for testing
- Session management and route protection

### 📤 Image Upload & Management
- Drag-and-drop image upload interface
- File validation (type, size limits)
- Image library with thumbnail previews
- Support for common image formats (PNG, JPG, GIF)

### 🔍 Image Comparison & Analysis
- Select up to 2 images for comparison
- Azure Cognitive Services integration for intelligent analysis
- Detailed difference detection with confidence scores
- Categorized results (Infrastructure, Vegetation, Water, Urban)
- Visual indicators and location mapping of changes

### 📱 Modern User Interface
- Responsive design for desktop and mobile
- Clean, intuitive user interface with Tailwind CSS
- Real-time feedback and loading states
- Tabbed navigation for different features

## Technology Stack

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Authentication**: NextAuth.js with credentials provider
- **Cloud Services**: Azure Cognitive Services (Computer Vision API)
- **File Handling**: Node.js filesystem APIs for image uploads
- **State Management**: React hooks and local state

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure Cognitive Services account (optional for demo)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd SatWatcher
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` with your Azure credentials:
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   AZURE_VISION_KEY=your-azure-vision-key
   AZURE_VISION_ENDPOINT=https://your-region.cognitiveservices.azure.com/
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Login

For testing purposes, use these credentials:
- **Email**: demo@example.com
- **Password**: demo123

## Usage Guide

### 1. Login
- Use the demo credentials or set up your own authentication
- Successful login redirects to the dashboard

### 2. Upload Images
- Navigate to the "Upload Images" tab
- Drag and drop satellite images or click to browse
- Supported formats: PNG, JPG, GIF (max 10MB)

### 3. Select Images for Comparison
- Go to the "Image Library" tab
- Click on images to select them (up to 2)
- Selected images are highlighted with a blue border

### 4. Compare Images
- Switch to the "Compare Images" tab
- Review your selected images
- Click "Compare Images" to start analysis
- View detailed results with confidence scores and categories

## Azure Cognitive Services Integration

The application integrates with Azure Computer Vision API to:
- Analyze image content and objects
- Detect differences between satellite images
- Categorize changes by type (infrastructure, vegetation, etc.)
- Provide confidence scores for detected changes

### Demo Mode
If Azure credentials are not configured, the app runs in demo mode with simulated analysis results.

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # NextAuth configuration
│   │   ├── upload/    # Image upload endpoint
│   │   └── compare/   # Image comparison endpoint
│   ├── dashboard/     # Main dashboard page
│   ├── register/      # Registration page
│   └── layout.tsx     # Root layout
├── components/        # Reusable React components
│   ├── Header.tsx
│   ├── LoginForm.tsx
│   ├── ImageUpload.tsx
│   ├── ImageLibrary.tsx
│   └── ImageComparison.tsx
└── globals.css        # Global styles
```

## API Endpoints

- `POST /api/upload` - Upload satellite images
- `POST /api/compare` - Compare two images using Azure CV
- `GET/POST /api/auth/*` - NextAuth.js authentication routes

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Secret for session encryption | Yes |
| `AZURE_VISION_KEY` | Azure Computer Vision API key | No (demo mode) |
| `AZURE_VISION_ENDPOINT` | Azure CV service endpoint | No (demo mode) |

## Security Considerations

- File upload validation and size limits
- Secure session management with NextAuth.js
- Environment variable protection
- Input sanitization and validation

## Future Enhancements

- [ ] User registration and profile management
- [ ] Image metadata extraction and display
- [ ] Advanced filtering and search capabilities
- [ ] Export comparison reports
- [ ] Batch image processing
- [ ] Geographic information integration
- [ ] Historical change tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
- Check the [GitHub Issues](./issues)
- Review the [Azure Computer Vision documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/)
- Consult the [Next.js documentation](https://nextjs.org/docs)
