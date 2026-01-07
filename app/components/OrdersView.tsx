'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import OrdersList from './OrdersList';
import OrderDetail from './OrderDetail';
import ThemeToggle from './ThemeToggle';
import FilterPanel, { OrderFilters } from './FilterPanel';
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
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<OrderFilters>({
    statusIds: [],
    equipmentTypeIds: [],
    pickupDateFrom: '',
    pickupDateTo: '',
    deliveryDateFrom: '',
    deliveryDateTo: '',
  });
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const handleOrderCreated = () => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrderId(orderId);
    setMobileView('detail'); // Switch to detail view on mobile
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setRefreshKey(prev => prev + 1);
  };

  // Count active filters
  const activeFilterCount = [
    ...filters.statusIds,
    ...filters.equipmentTypeIds,
    filters.pickupDateFrom,
    filters.pickupDateTo,
    filters.deliveryDateFrom,
    filters.deliveryDateTo,
  ].filter(Boolean).length;

  const activeOrdersCount = initialData?.total || 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Header */}
      <div className="h-auto lg:h-16 bg-card border-b border-border px-3 lg:px-6 py-3 lg:py-0 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-0">
          {/* Logo and Badge Row */}
          <div className="flex items-center justify-between lg:justify-start gap-3 lg:gap-6">
            {/* Back Button for Mobile Detail View */}
            {mobileView === 'detail' && (
              <button
                onClick={handleBackToList}
                className="lg:hidden p-2 -ml-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Back to orders list"
              >
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Logo */}
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="relative">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-[#F4B223]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
                </svg>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Hemut</h1>
            </div>
            
            {/* Active Orders Badge */}
            <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-muted/50 rounded-lg">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Active orders</span>
              <span className="text-base md:text-lg font-bold text-foreground">{activeOrdersCount}</span>
            </div>
          </div>

          {/* Search & Actions Row */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search */}
            <div className="relative flex-1 md:flex-initial">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full md:w-64 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Filter Button */}
            <button 
              onClick={() => setShowFilterPanel(true)}
              className="p-2 hover:bg-accent rounded-lg transition-colors border border-border flex-shrink-0 relative"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F4B223] text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {/* Create Order Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 md:px-4 py-2 bg-[#F4B223] text-gray-900 font-semibold rounded-lg hover:bg-[#E5A420] transition-colors shadow-sm flex items-center gap-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden md:inline">Create Order</span>
              <span className="md:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Responsive Flex */}
      <div className="flex-1 flex overflow-hidden">
        {/* Orders List - Show on mobile when mobileView === 'list', always show on desktop */}
        <div className={`w-full lg:w-2/5 border-r border-border flex flex-col bg-card ${
          mobileView === 'detail' ? 'hidden lg:flex' : 'flex'
        }`}>
          <OrdersList
            refreshTrigger={refreshKey}
            onOrderSelect={handleOrderSelect}
            selectedOrderId={selectedOrderId}
            initialData={initialData}
            searchQuery={searchQuery}
            filters={filters}
          />
        </div>

        {/* Order Details - Show on mobile when mobileView === 'detail', always show on desktop */}
        <div className={`flex-1 flex flex-col bg-muted/20 ${
          mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        }`}>
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

      {/* Filter Panel */}
      {showFilterPanel && (
        <FilterPanel
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFilterPanel(false)}
        />
      )}
    </div>
  );
}

