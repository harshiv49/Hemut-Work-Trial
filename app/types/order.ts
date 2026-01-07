export interface Address {
  id: number;
  location_name: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  latitude: string | null;
  longitude: string | null;
  created_at: string;
  updated_at: string;
}

export interface StopType {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Stop {
  id: number;
  order_id: number;
  address_id: number;
  stop_type_id: number;
  sequence_number: number;
  scheduled_arrival_early: string | null;
  scheduled_arrival_late: string | null;
  address: Address | null;
  stop_type: StopType | null;
  created_at: string;
  updated_at: string;
}

export interface Load {
  id: number;
  order_id: number;
  weight_lbs: number | null;
  commodity: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: number;
  order_id: number;
  miles: number | null;
  rate: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentType {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatus {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  id: number;
  order_id: number;
  stop_id: number | null;
  status: string;
  location: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  equipment_type_id: number;
  status_id: number;
  customer: Customer | null;
  equipment_type: EquipmentType | null;
  status: OrderStatus | null;
  stops: Stop[] | null;
  load: Load | null;
  quotation: Quotation | null;
  tracking_events?: TrackingEvent[] | null;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  skip: number;
  limit: number;
}

