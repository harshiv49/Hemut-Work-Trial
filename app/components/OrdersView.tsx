'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import OrdersList from './OrdersList';
import OrderDetail from './OrderDetail';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
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

  const activeOrdersCount = initialData?.total || 0;

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar 
        activeOrdersCount={activeOrdersCount} 
        onCreateOrder={() => setShowCreateForm(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">Tracking Orders</h2>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Order
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Orders List */}
          <div className="w-2/5 border-r border-border flex flex-col bg-card">
            <OrdersList
              refreshTrigger={refreshKey}
              onOrderSelect={setSelectedOrderId}
              selectedOrderId={selectedOrderId}
              initialData={initialData}
            />
          </div>

          {/* Right Panel - Order Details */}
          <div className="flex-1 flex flex-col bg-muted/20">
            <OrderDetail orderId={selectedOrderId} />
          </div>
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

