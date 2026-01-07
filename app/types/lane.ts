// Lane-related TypeScript interfaces

export interface Lane {
  id: number;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  equipment_type_id: number;
  equipment_type?: {
    id: number;
    name: string;
    description: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface LanePricing {
  id: number;
  lane_id: number;
  order_id: number | null;
  base_rate: number;
  accessories_cost: number;
  margin_amount: number;
  total_cost: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface LaneAccessory {
  id: number;
  name: string;
  description: string | null;
  cost: number;
  is_percentage: boolean; // true if percentage-based, false if flat rate
  created_at: string;
  updated_at: string;
}

export interface LaneHistoryItem {
  id: number;
  order_id: number;
  lane_pricing: LanePricing;
  quoted_date: string;
  accepted: boolean;
}

export interface LaneCalculation {
  base_rate: number;
  accessories: Array<{
    accessory_id: number;
    name: string;
    cost: number;
    is_percentage: boolean;
    calculated_amount: number;
  }>;
  margin_percentage: number;
  margin_amount: number;
  subtotal: number;
  total: number;
}

