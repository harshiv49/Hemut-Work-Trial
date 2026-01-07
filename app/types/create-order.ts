// Types for creating a new order

export interface AddressFormData {
  location_name: string;
  location_id?: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
}

export interface StopFormData {
  stop_type: 'PICKUP' | 'DELIVERY';
  sequence_number: number;
  address: AddressFormData;
  scheduled_arrival_early?: string;
  scheduled_arrival_late?: string;
}

export interface LoadFormData {
  weight_lbs?: number;
  commodity?: string;
}

export interface QuotationFormData {
  miles?: number;
  rate?: number;
  currency?: string;
}

export interface OrderFormData {
  customer_id?: number;
  equipment_type_id?: number;
  stops: StopFormData[];
  load?: LoadFormData;
  quotation?: QuotationFormData;
  bill_of_lading_number?: string;
  shipment_id?: string;
  bol_notes?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
}

export interface EquipmentType {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateOrderResponse {
  user_message?: string;
  dev_message?: string;
}

