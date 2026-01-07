import { Order, OrderListResponse } from '../types/order';
import { OrderFormData } from '../types/create-order';
import { Lane, LaneHistoryItem, LaneAccessory, LaneCalculation } from '../types/lane';

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

// =========================
// Lane API Functions
// =========================

export async function fetchLanes(): Promise<Lane[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/lanes/`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lanes: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching lanes:', error);
    throw error;
  }
}

export async function fetchLaneById(laneId: number): Promise<Lane> {
  try {
    const response = await fetch(`${API_BASE_URL}/lanes/${laneId}`, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch lane: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching lane:', error);
    throw error;
  }
}

export async function searchLanes(
  originCity?: string,
  originState?: string,
  destinationCity?: string,
  destinationState?: string,
  equipmentTypeId?: number
): Promise<Lane[]> {
  try {
    const params = new URLSearchParams();
    if (originCity) params.append('origin_city', originCity);
    if (originState) params.append('origin_state', originState);
    if (destinationCity) params.append('destination_city', destinationCity);
    if (destinationState) params.append('destination_state', destinationState);
    if (equipmentTypeId) params.append('equipment_type_id', equipmentTypeId.toString());

    const response = await fetch(`${API_BASE_URL}/lanes/search?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to search lanes');
    }

    return response.json();
  } catch (error) {
    console.error('Error searching lanes:', error);
    throw error;
  }
}

export async function fetchLaneHistory(laneId: number): Promise<LaneHistoryItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/lanes/${laneId}/history`, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lane history');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching lane history:', error);
    throw error;
  }
}

export async function fetchLaneAccessories(): Promise<LaneAccessory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/lanes/accessories/`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lane accessories');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching lane accessories:', error);
    throw error;
  }
}

export async function saveLanePricing(
  laneId: number,
  calculation: LaneCalculation,
  orderId?: number
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/lanes/${laneId}/pricing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        base_rate: calculation.base_rate,
        accessories_cost: calculation.accessories.reduce(
          (sum, acc) => sum + acc.calculated_amount,
          0
        ),
        margin_amount: calculation.margin_amount,
        total_cost: calculation.total,
        currency: 'USD',
        accessories: calculation.accessories.map((acc) => ({
          accessory_id: acc.accessory_id,
          calculated_amount: acc.calculated_amount,
        })),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.user_message || data.dev_message || 'Failed to save lane pricing');
    }

    return response.json();
  } catch (error) {
    console.error('Error saving lane pricing:', error);
    throw error;
  }
}

export async function createLane(
  originCity: string,
  originState: string,
  destinationCity: string,
  destinationState: string,
  equipmentTypeId: number
): Promise<Lane> {
  try {
    const response = await fetch(`${API_BASE_URL}/lanes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin_city: originCity,
        origin_state: originState,
        destination_city: destinationCity,
        destination_state: destinationState,
        equipment_type_id: equipmentTypeId,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.user_message || data.dev_message || 'Failed to create lane');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating lane:', error);
    throw error;
  }
}

