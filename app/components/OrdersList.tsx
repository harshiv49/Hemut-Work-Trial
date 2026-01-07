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
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Orders</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {orders.length} of {total} orders
            </p>
          </div>
          <button
            onClick={() => mutate()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => onOrderSelect(order.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedOrderId === order.id
                    ? 'bg-yellow-50 border-l-4 border-yellow-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        Order #{order.id}
                      </span>
                      {order.customer && (
                        <span className="text-gray-600">• {order.customer.name}</span>
                      )}
                    </div>
                    {order.equipment_type && (
                      <div className="text-sm text-gray-600 mb-1">
                        {order.equipment_type.name}
                        {order.equipment_type.description && (
                          <span className="text-gray-500">
                            {' / '}
                            {order.equipment_type.description}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status?.name === 'CREATED'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status?.name === 'QUOTED'
                            ? 'bg-green-100 text-green-800'
                            : order.status?.name === 'BOOKED'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status?.name === 'IN_TRANSIT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status?.name === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status?.name || 'Unknown'}
                      </span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

OrdersList.displayName = 'OrdersList';

export default OrdersList;
