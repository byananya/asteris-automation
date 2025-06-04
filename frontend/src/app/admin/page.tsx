'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/emails" className="block p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Email Subscribers</h2>
          <p className="text-gray-600">View and manage email subscribers</p>
        </Link>
        
        {/* Add more admin sections here as needed */}
      </div>
    </div>
  );
}
