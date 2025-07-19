import Link from 'next/link'
import Image from 'next/image'
import LoginFormWrapper from '@/components/LoginFormWrapper'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src="/images/satwatch.png"
              alt="SatWatcher Logo"
              width={200}
              height={100}
              className="mx-auto"
              priority
            />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SatWatcher
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Compare satellite images using Azure Cognitive Services
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <LoginFormWrapper />
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
