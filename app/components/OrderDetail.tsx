'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { Order } from '../types/order';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-lg text-gray-600">Loading map...</div>
    </div>
  ),
});

type TabType = 'load' | 'customer' | 'map';

export default function OrderDetail({ orderId }: { orderId: number | null }) {
  const [activeTab, setActiveTab] = useState<TabType>('load');

  const { data: order, error, isLoading } = useSWR<Order>(
    orderId ? `http://localhost:8000/orders/${orderId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  if (!orderId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-base">Select an order to view details</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading order details...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-lg max-w-md">
          <p className="font-semibold">Error loading order</p>
          <p className="text-sm mt-1 opacity-90">{error?.message || 'Failed to fetch order details'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Map Section */}
      <div className="h-80 bg-card border-b border-border">
        <MapView order={order} />
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('load')}
            className={`px-4 py-4 font-medium text-sm transition-colors relative ${
              activeTab === 'load'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Order details
            {activeTab === 'load' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-4 py-4 font-medium text-sm transition-colors relative ${
              activeTab === 'customer'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Driver information
            {activeTab === 'customer' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-4 font-medium text-sm transition-colors relative ${
              activeTab === 'map'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Vehicle
            {activeTab === 'map' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 bg-card">
        {activeTab === 'load' && (
          <div className="space-y-6">
            <div className="bg-background rounded-lg border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Load Information</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Team Driver</label>
                  <p className="mt-1 text-sm text-foreground">No</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Hazmat</label>
                  <p className="mt-1 text-sm text-foreground">No</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Miles</label>
                  <p className="mt-1 text-sm text-foreground font-medium">
                    {order.quotation?.miles || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Stops</label>
                  <p className="mt-1 text-sm text-foreground font-medium">
                    {order.stops?.length || 0}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Commodity</label>
                  <p className="mt-1 text-sm text-foreground">
                    {order.load?.commodity || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Weight</label>
                  <p className="mt-1 text-sm text-foreground">
                    {order.load?.weight_lbs ? `${order.load.weight_lbs.toLocaleString()} lbs` : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-background rounded-lg border border-border p-5">
                <label className="text-xs font-medium text-muted-foreground block mb-2">Special Requirements</label>
                <p className="text-sm text-foreground">Not specified</p>
              </div>

              <div className="bg-background rounded-lg border border-border p-5">
                <label className="text-xs font-medium text-muted-foreground block mb-2">Accessorials</label>
                <span className="inline-flex px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  DRIVER_ASSIST
                </span>
              </div>

              <div className="bg-background rounded-lg border border-border p-5">
                <label className="text-xs font-medium text-muted-foreground block mb-2">Comments</label>
                <p className="text-sm text-foreground">Not specified</p>
              </div>
            </div>

            {order.stops && order.stops.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 block">Route Stops</label>
                <div className="space-y-3">
                  {order.stops
                    .sort((a, b) => a.sequence_number - b.sequence_number)
                    .map((stop, index) => (
                      <div key={stop.id} className="bg-background border border-border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                              stop.stop_type?.name === 'PICKUP' 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}>
                              {index + 1}
                            </div>
                            {index < order.stops.length - 1 && (
                              <div className="w-0.5 h-8 bg-border mt-1"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm text-foreground">
                                {stop.stop_type?.name === 'PICKUP' ? 'Pickup' : 'Delivery'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {stop.address?.city}, {stop.address?.state}
                              </span>
                            </div>
                            {stop.address && (
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                {stop.address.location_name && (
                                  <p className="text-foreground font-medium">{stop.address.location_name}</p>
                                )}
                                {stop.address.street && <p>{stop.address.street}</p>}
                                <p>
                                  {stop.address.city}, {stop.address.state} {stop.address.zip_code}
                                </p>
                                {stop.scheduled_arrival_early && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    📅 {formatDate(stop.scheduled_arrival_early)}
                                    {stop.scheduled_arrival_late && (
                                      <span> - {formatDate(stop.scheduled_arrival_late)}</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {order.quotation && (
              <div className="bg-background rounded-lg border border-border p-5">
                <label className="text-sm font-semibold text-foreground mb-4 block">Quotation</label>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block mb-1">Miles</span>
                    <p className="text-lg font-semibold text-foreground">{order.quotation.miles || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground block mb-1">Rate</span>
                    <p className="text-lg font-semibold text-foreground">
                      {order.quotation.rate
                        ? `${order.quotation.currency || 'USD'} $${order.quotation.rate}`
                        : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="space-y-6">
            {order.customer ? (
              <>
                <div className="bg-background rounded-lg border border-border p-5">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">
                        {order.customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{order.customer.name}</h3>
                      <p className="text-sm text-muted-foreground">Customer</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-border">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
                      <p className="text-sm text-foreground">{order.customer.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Customer ID</label>
                      <p className="text-sm text-foreground">#{order.customer.id}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Created At</label>
                      <p className="text-sm text-foreground">
                        {formatDateTime(order.customer.created_at)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Contact</label>
                      <p className="text-sm text-foreground">855-223-0317</p>
                    </div>
                  </div>
                </div>

                {order.equipment_type && (
                  <div className="bg-background rounded-lg border border-border p-5">
                    <label className="text-sm font-semibold text-foreground mb-4 block">Equipment Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">Name</span>
                        <p className="text-sm text-foreground">{order.equipment_type.name}</p>
                      </div>
                      {order.equipment_type.description && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground block mb-1">Description</span>
                          <p className="text-sm text-foreground">{order.equipment_type.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <p>No customer information available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="text-center text-muted-foreground py-12">
            <p>Vehicle information would be displayed here</p>
          </div>
        )}
      </div>
    </div>
  );
}

