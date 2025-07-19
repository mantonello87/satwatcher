import Link from 'next/link'
import Image from 'next/image'
import RegisterForm from '@/components/RegisterForm'

export default function Register() {
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
            Create Account
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Register for SatWatcher to start analyzing satellite images
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <RegisterForm />
          </div>
        </div>
      </div>
    </main>
  )
}
