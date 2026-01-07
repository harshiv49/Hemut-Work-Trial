'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import OrdersList from './OrdersList';
import OrderDetail from './OrderDetail';
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
  const [searchQuery, setSearchQuery] = useState('');

  const handleOrderCreated = () => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const activeOrdersCount = initialData?.total || 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Header */}
      <div className="h-16 bg-card border-b border-border px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="w-8 h-8 text-[#F4B223]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Semut</h1>
          </div>
          
          {/* Active Orders Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Active orders</span>
            <span className="text-lg font-bold text-foreground">{activeOrdersCount}</span>
          </div>
        </div>

        {/* Right Side - Search & Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Filter Button */}
          <button className="p-2 hover:bg-accent rounded-lg transition-colors border border-border">
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Create Order Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-[#F4B223] text-gray-900 font-semibold rounded-lg hover:bg-[#E5A420] transition-colors shadow-sm flex items-center gap-2"
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
            searchQuery={searchQuery}
          />
        </div>

        {/* Right Panel - Order Details */}
        <div className="flex-1 flex flex-col bg-muted/20">
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

