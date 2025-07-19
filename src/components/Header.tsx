'use client'

import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image
              src="/images/satwatch.png"
              alt="SatWatcher Logo"
              width={80}
              height={40}
              className="object-contain"
              priority
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SatWatcher</h1>
              <p className="text-sm text-gray-600">Satellite Image Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {session && (
              <>
                <span className="text-gray-700">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
