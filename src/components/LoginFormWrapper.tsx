'use client'

import { Suspense } from 'react'
import LoginForm from './LoginForm'

// Loading component for the suspense boundary
function LoginFormSkeleton() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
      <div className="space-y-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 bg-blue-500 rounded"></div>
      </div>
    </div>
  )
}

// Wrapper component with Suspense boundary
export default function LoginFormWrapper() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}
