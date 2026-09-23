import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <header className="bg-white border-b-4 border-orange-500 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-b from-orange-500 via-white to-green-600 rounded-full flex items-center justify-center">
              <span className="text-blue-900 font-bold text-xl">🇮🇳</span>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-blue-900">NRI Remote Voting System</h1>
              <p className="text-sm text-gray-600">Government of India</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-blue-900 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2026 Election Commission of India. All rights reserved.</p>
          <p className="text-xs mt-2 text-gray-300">Secure | Transparent | Democratic</p>
        </div>
      </footer>
    </div>
  );
}
