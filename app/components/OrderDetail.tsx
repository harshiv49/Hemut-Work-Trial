'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { Order } from '../types/order';
import TrackingTimeline from './TrackingTimeline';
import LaneHistory from './LaneHistory';
import LaneCalculator from './LaneCalculator';
import { LaneCalculation } from '../types/lane';

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

// Dynamically import TrackingMapView for live tracking
const TrackingMapView = dynamic(() => import('./TrackingMapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-lg text-gray-600">Loading tracking map...</div>
    </div>
  ),
});

type TabType = 'load' | 'customer' | 'tracking' | 'lane-history' | 'calculator';

export default function OrderDetail({ orderId }: { orderId: number | null }) {
  const [activeTab, setActiveTab] = useState<TabType>('load');
  const [showMap, setShowMap] = useState(false);
  const [useTrackingMap, setUseTrackingMap] = useState(false);
  const [laneCalculation, setLaneCalculation] = useState<LaneCalculation | null>(null);

  const { data: order, error, isLoading } = useSWR<Order>(
    orderId ? `http://localhost:8000/orders/${orderId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

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

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row px-3 sm:px-6 justify-between items-stretch sm:items-center gap-2 sm:gap-0 py-2 sm:py-0">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('load')}
              className={`px-3 sm:px-4 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
                activeTab === 'load'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Order details
              {activeTab === 'load' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4B223]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-3 sm:px-4 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
                activeTab === 'customer'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Customer information
              {activeTab === 'customer' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4B223]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-3 sm:px-4 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
                activeTab === 'tracking'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tracking
              {activeTab === 'tracking' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4B223]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('lane-history')}
              className={`px-3 sm:px-4 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
                activeTab === 'lane-history'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Lane History
              {activeTab === 'lane-history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4B223]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 sm:px-4 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Calculator
              {activeTab === 'calculator' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4B223]"></div>
              )}
            </button>
          </div>
          
          {/* Map Toggle Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowMap(!showMap);
                if (!showMap) setUseTrackingMap(false);
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                showMap && !useTrackingMap
                  ? 'bg-[#F4B223] text-gray-900' 
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Route
            </button>
            <button
              onClick={() => {
                setShowMap(true);
                setUseTrackingMap(!useTrackingMap);
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                showMap && useTrackingMap
                  ? 'bg-[#F4B223] text-gray-900' 
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Live Track
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`p-3 sm:p-6 bg-card overflow-y-auto transition-all duration-300 ease-in-out ${showMap ? 'h-1/2 md:h-1/2' : 'h-full'}`}>
        {activeTab === 'load' && (
          <div className="space-y-6">
            {/* Price Summary Card */}
            <div className="bg-gradient-to-r from-[#F4B223]/10 to-[#F4B223]/5 rounded-lg border border-[#F4B223]/20 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Order Price</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-[#F4B223]">
                    {order.quotation?.rate 
                      ? `${order.quotation.currency || 'USD'} $${Number(order.quotation.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'TBD'}
                  </p>
                  {!order.quotation?.rate && (
                    <p className="text-xs text-muted-foreground mt-1">Price to be determined</p>
                  )}
                </div>
                <div className="bg-[#F4B223] text-gray-900 rounded-full p-3 sm:p-4">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Load Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-4">
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
              <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
                <label className="text-xs font-medium text-muted-foreground block mb-2">Special Requirements</label>
                <p className="text-sm text-foreground">Not specified</p>
              </div>

              <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
                <label className="text-xs font-medium text-muted-foreground block mb-2">Accessorials</label>
                <span className="inline-flex px-3 py-1 bg-[#F4B223]/10 text-[#D69E1F] text-xs font-medium rounded-full">
                  DRIVER_ASSIST
                </span>
              </div>

              <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
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
                                ? 'bg-[#F4B223]/20 text-[#D69E1F]' 
                                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {index + 1}
                            </div>
                            {order.stops && index < order.stops.length - 1 && (
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
              <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
                <label className="text-sm font-semibold text-foreground mb-4 block">Quotation</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-full bg-[#F4B223]/20 flex items-center justify-center">
                      <span className="text-3xl font-bold text-[#D69E1F]">
                        {order.customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-foreground">{order.customer.name}</h3>
                      <p className="text-sm text-muted-foreground">Customer</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-4 pt-4 border-t border-border">
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
                  <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
                    <label className="text-sm font-semibold text-foreground mb-4 block">Equipment Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {activeTab === 'tracking' && (
          <div>
            <TrackingTimeline orderId={orderId} />
          </div>
        )}

        {activeTab === 'lane-history' && (
          <div>
            {order.stops && order.stops.length >= 2 ? (
              (() => {
                const sortedStops = [...order.stops].sort((a, b) => a.sequence_number - b.sequence_number);
                const pickupStop = sortedStops[0];
                const deliveryStop = sortedStops[sortedStops.length - 1];
                
                return (
                  <LaneHistory
                    originCity={pickupStop?.address?.city || undefined}
                    originState={pickupStop?.address?.state || undefined}
                    destCity={deliveryStop?.address?.city || undefined}
                    destState={deliveryStop?.address?.state || undefined}
                    equipmentType={order.equipment_type?.name}
                  />
                );
              })()
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <p>Not enough stops to display lane information</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calculator' && (
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <div className="bg-[#F4B223] text-gray-900 rounded-lg p-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              Billing Calculator
            </h3>
            <LaneCalculator
              baseRate={order.quotation?.rate ?? undefined}
              onCalculationChange={setLaneCalculation}
            />
            
            {laneCalculation && (
              <div className="mt-6">
                <button
                  className="w-full px-6 py-3 bg-[#F4B223] text-gray-900 font-bold rounded-lg hover:bg-[#E5A420] transition-all shadow-sm flex items-center justify-center gap-2"
                  onClick={() => {
                    // TODO: Implement save functionality
                    alert('Lane pricing saved! (Backend integration needed)');
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Lane Pricing
                </button>
              </div>
            )}
          </div>
        )}

        </div>

        {/* Toggleable Map at Bottom - Expands downward */}
        <div 
          className={`bg-card border-t border-border transition-all duration-300 ease-in-out overflow-hidden ${
            showMap ? 'h-1/2 md:h-1/2' : 'h-0'
          }`}
        >
          {showMap && (
            <div className="h-full">
              {useTrackingMap ? (
                <TrackingMapView order={order} />
              ) : (
                <MapView order={order} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

