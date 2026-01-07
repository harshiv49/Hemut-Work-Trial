'use client';

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import useSWR from 'swr';
import { OrderListResponse } from '../types/order';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface OrdersListRef {
  refresh: () => void;
}

interface OrdersListProps {
  onOrderSelect: (orderId: number) => void;
  selectedOrderId: number | null;
  initialData: OrderListResponse | null;
  refreshTrigger?: number;
}

const OrdersList = forwardRef<OrdersListRef, OrdersListProps>(({ 
  onOrderSelect,
  selectedOrderId,
  initialData,
  refreshTrigger
}, ref) => {
  const { data, error, isLoading, mutate } = useSWR<OrderListResponse>(
    'http://localhost:8000/orders/',
    fetcher,
    {
      fallbackData: initialData || undefined,
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  useImperativeHandle(ref, () => ({
    refresh: () => mutate()
  }));

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      mutate();
    }
  }, [refreshTrigger, mutate]);

  const formatDate = (dateString: string) => {
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

  // Get pickup and delivery cities from stops
  const getRouteCities = (order: any) => {
    if (!order.stops || order.stops.length === 0) {
      return { pickup: null, delivery: null };
    }

    const sortedStops = [...order.stops].sort((a, b) => a.sequence_number - b.sequence_number);
    const pickupStop = sortedStops.find((stop: any) => stop.stop_type?.name === 'PICKUP');
    const deliveryStop = sortedStops.reverse().find((stop: any) => stop.stop_type?.name === 'DROP');

    return {
      pickup: pickupStop?.address?.city && pickupStop?.address?.state 
        ? `${pickupStop.address.city}, ${pickupStop.address.state}`
        : null,
      delivery: deliveryStop?.address?.city && deliveryStop?.address?.state
        ? `${deliveryStop.address.city}, ${deliveryStop.address.state}`
        : null
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-600">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-semibold">Error loading orders</p>
          <p className="text-sm mt-1">{error.message || 'Failed to fetch orders'}</p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const orders = data?.orders || [];
  const total = data?.total || 0;

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Showing {orders.length} of {total} orders
            </p>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh orders"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {orders.map((order) => {
              const { pickup, delivery } = getRouteCities(order);
              const isSelected = selectedOrderId === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => onOrderSelect(order.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'bg-card border-transparent hover:bg-accent hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        ID {order.id}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          order.status?.name === 'CREATED'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : order.status?.name === 'QUOTED'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : order.status?.name === 'BOOKED'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : order.status?.name === 'IN_TRANSIT'
                            ? 'bg-primary/10 text-primary'
                            : order.status?.name === 'COMPLETED'
                            ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                            : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {order.status?.name === 'IN_TRANSIT' ? 'In transit' : 
                         order.status?.name === 'CREATED' ? 'No connection' : 
                         order.status?.name?.replace(/_/g, ' ').toLowerCase() || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  {order.equipment_type && (
                    <div className="text-sm font-medium text-foreground mb-3">
                      {order.equipment_type.name}
                    </div>
                  )}

                  {/* Route Information */}
                  {(pickup || delivery) && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">23 Apr</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="3" />
                          </svg>
                          <span className="text-foreground font-medium">{pickup || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">25 Apr</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="10" r="3" />
                          </svg>
                          <span className="text-foreground font-medium">{delivery || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

OrdersList.displayName = 'OrdersList';

export default OrdersList;
