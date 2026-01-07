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
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select an order to view details</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-semibold">Error loading order</p>
          <p className="text-sm mt-1">{error?.message || 'Failed to fetch order details'}</p>
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            {order.customer?.name || `Order #${order.id}`}
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('load')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'load'
                ? 'border-b-2 border-yellow-500 text-yellow-600 bg-yellow-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Load Details
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'customer'
                ? 'border-b-2 border-yellow-500 text-yellow-600 bg-yellow-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Customer Details
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'map'
                ? 'border-b-2 border-yellow-500 text-yellow-600 bg-yellow-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📍 Map View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'load' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Team Driver</label>
                <p className="mt-1 text-sm text-gray-900">No</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Hazmat</label>
                <p className="mt-1 text-sm text-gray-900">No</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Miles</label>
                <p className="mt-1 text-sm text-gray-900">
                  {order.quotation?.miles || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Stops</label>
                <p className="mt-1 text-sm text-gray-900">
                  {order.stops?.length || 0}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Commodity</label>
                <p className="mt-1 text-sm text-gray-900">
                  {order.load?.commodity || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Weight</label>
                <p className="mt-1 text-sm text-gray-900">
                  {order.load?.weight_lbs ? `${order.load.weight_lbs.toLocaleString()} lbs` : 'Not specified'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Special Requirements</label>
              <p className="mt-1 text-sm text-gray-900">Not specified</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Accessorials</label>
              <p className="mt-1 text-sm text-gray-900">DRIVER_ASSIST</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Required Endorsements</label>
              <p className="mt-1 text-sm text-gray-900">Not specified</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Comments</label>
              <p className="mt-1 text-sm text-gray-900">Not specified</p>
            </div>

            {order.stops && order.stops.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Stops</label>
                <div className="space-y-4">
                  {order.stops
                    .sort((a, b) => a.sequence_number - b.sequence_number)
                    .map((stop) => (
                      <div key={stop.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {stop.stop_type?.name === 'PICKUP' ? 'Pickup' : 'Delivery'} #{stop.sequence_number}
                          </span>
                          <span className="text-xs text-gray-500">
                            {stop.address?.city}, {stop.address?.state}
                          </span>
                        </div>
                        {stop.address && (
                          <div className="text-sm text-gray-600 space-y-1">
                            {stop.address.location_name && (
                              <p>{stop.address.location_name}</p>
                            )}
                            {stop.address.street && <p>{stop.address.street}</p>}
                            <p>
                              {stop.address.city}, {stop.address.state} {stop.address.zip_code}
                            </p>
                            {stop.scheduled_arrival_early && (
                              <p className="text-xs text-gray-500 mt-2">
                                Scheduled: {formatDate(stop.scheduled_arrival_early)}
                                {stop.scheduled_arrival_late && (
                                  <span> - {formatDate(stop.scheduled_arrival_late)}</span>
                                )}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-500 mb-2 block">Competitive Bid Data</label>
              <p className="text-sm text-gray-900">None</p>
            </div>

            {order.quotation && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-500 mb-2 block">Quotation</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">Miles</span>
                    <p className="text-sm text-gray-900">{order.quotation.miles || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Rate</span>
                    <p className="text-sm text-gray-900">
                      {order.quotation.rate
                        ? `${order.quotation.currency || 'USD'} ${order.quotation.rate}`
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
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Name</label>
                    <p className="mt-1 text-sm text-gray-900">{order.customer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{order.customer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer ID</label>
                    <p className="mt-1 text-sm text-gray-900">#{order.customer.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateTime(order.customer.created_at)}
                    </p>
                  </div>
                </div>

                {order.equipment_type && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Equipment Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">Name</span>
                        <p className="text-sm text-gray-900">{order.equipment_type.name}</p>
                      </div>
                      {order.equipment_type.description && (
                        <div>
                          <span className="text-xs text-gray-500">Description</span>
                          <p className="text-sm text-gray-900">{order.equipment_type.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Shipment Contact Information</label>
                  <p className="text-sm text-gray-900">855-223-0317</p>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No customer information available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-full -m-6">
            <MapView order={order} />
          </div>
        )}
      </div>
    </div>
  );
}

