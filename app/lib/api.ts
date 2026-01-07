import { Order, OrderListResponse } from '../types/order';
import { OrderFormData } from '../types/create-order';

const API_BASE_URL = 'http://localhost:8000';

export async function fetchOrders(): Promise<OrderListResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/`, {
    next: { revalidate: 0 }, // Always fetch fresh data on server
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchOrderById(orderId: number): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    next: { revalidate: 0 },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.statusText}`);
  }
  
  return response.json();
}

export async function createOrder(orderData: OrderFormData): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.user_message || data.dev_message || 'Failed to create order');
  }

  return data;
}

export async function fetchCustomers() {
  const response = await fetch(`${API_BASE_URL}/customers/`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }

  return response.json();
}

export async function searchCustomers(query: string) {
  if (!query.trim()) {
    return { customers: [], total: 0, skip: 0, limit: 100 };
  }
  
  const response = await fetch(`${API_BASE_URL}/customers/query?q=${encodeURIComponent(query)}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to search customers');
  }

  return response.json();
}

export async function fetchEquipmentTypes() {
  const response = await fetch(`${API_BASE_URL}/equipment-types/`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch equipment types');
  }

  return response.json();
}

export async function searchEquipmentTypes(query: string) {
  if (!query.trim()) {
    return { equipment_types: [], total: 0, skip: 0, limit: 100 };
  }
  
  const response = await fetch(`${API_BASE_URL}/equipment-types/query?q=${encodeURIComponent(query)}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to search equipment types');
  }

  return response.json();
}

