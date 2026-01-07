'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import OrdersList from './OrdersList';
import OrderDetail from './OrderDetail';
import { OrderListResponse } from '../types/order';

// Dynamically import CreateOrderForm to avoid SSR issues
const CreateOrderForm = dynamic(() => import('./CreateOrderForm'), {
  ssr: false,
});

export default function OrdersView({ 
  initialData 
}: { 
  initialData: OrderListResponse | null 
}) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOrderCreated = () => {
    setShowCreateForm(false);
    // Trigger refresh by updating key
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg z-40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-blue-600 rounded-lg p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Freight TMS</h1>
              <p className="text-blue-100 text-sm">Transportation Management System</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-yellow-400 text-yellow-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Order
          </button>
        </div>
      </div>

      {/* Main Content - with top padding for navbar */}
      <div className="flex w-full pt-20">
        {/* Left Panel - Orders List */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <OrdersList
            refreshTrigger={refreshKey}
            onOrderSelect={setSelectedOrderId}
            selectedOrderId={selectedOrderId}
            initialData={initialData}
          />
        </div>

        {/* Right Panel - Order Details */}
        <div className="w-1/2 flex flex-col">
          <OrderDetail orderId={selectedOrderId} />
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateForm && (
        <CreateOrderForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleOrderCreated}
        />
      )}
    </div>
  );
}

