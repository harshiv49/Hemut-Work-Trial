'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderFormData, StopFormData, AddressFormData, Customer, EquipmentType } from '../types/create-order';
import RouteMapPreview from './RouteMapPreview';
import AddressAutocomplete from './AddressAutocomplete';
import { createOrder, searchCustomers, searchEquipmentTypes } from '../lib/api';

// US States for dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

interface CreateOrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOrderForm({ onClose, onSuccess }: CreateOrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    stops: [
      {
        stop_type: 'PICKUP',
        sequence_number: 1,
        address: {
          location_name: '',
          street: '',
          city: '',
          state: '',
          zip_code: '',
        },
      },
    ],
    load: {
      weight_lbs: 0,
      commodity: '',
    },
    quotation: {
      miles: 0,
      rate: 0,
      currency: 'USD',
    },
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchEquipment, setSearchEquipment] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedEquipmentName, setSelectedEquipmentName] = useState('');
  const [zipLookupLoading, setZipLookupLoading] = useState<{ [key: number]: boolean }>({});

  // Debounced search for customers
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchCustomer.trim().length >= 2) {
        try {
          const data = await searchCustomers(searchCustomer);
          setCustomers(data.customers || []);
          setShowCustomerDropdown(true);
        } catch (err) {
          console.error('Error searching customers:', err);
        }
      } else {
        setCustomers([]);
        setShowCustomerDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchCustomer]);

  // Debounced search for equipment types
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchEquipment.trim().length >= 2) {
        try {
          const data = await searchEquipmentTypes(searchEquipment);
          setEquipmentTypes(data.equipment_types || []);
          setShowEquipmentDropdown(true);
        } catch (err) {
          console.error('Error searching equipment types:', err);
        }
      } else {
        setEquipmentTypes([]);
        setShowEquipmentDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchEquipment]);

  // Lookup city and state from ZIP code
  const lookupZipCode = async (stopIndex: number, zipCode: string) => {
    // Clean the ZIP code (remove spaces, dashes, etc.)
    const cleanZip = zipCode.replace(/[^0-9]/g, '');
    
    // Only lookup if we have a 5-digit ZIP
    if (cleanZip.length !== 5) {
      return;
    }

    setZipLookupLoading({ ...zipLookupLoading, [stopIndex]: true });

    try {
      // Using Zippopotam.us API (free, no API key required)
      const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          
          // Update city and state
          const newStops = [...formData.stops];
          newStops[stopIndex].address = {
            ...newStops[stopIndex].address,
            city: place['place name'],
            state: place['state abbreviation'],
            latitude: parseFloat(place.latitude),
            longitude: parseFloat(place.longitude),
          };
          setFormData({ ...formData, stops: newStops });
        }
      }
    } catch (error) {
      console.error('Error looking up ZIP code:', error);
    } finally {
      setZipLookupLoading({ ...zipLookupLoading, [stopIndex]: false });
    }
  };

  const addStop = () => {
    const newStop: StopFormData = {
      stop_type: 'DELIVERY',
      sequence_number: formData.stops.length + 1,
      address: {
        location_name: '',
        street: '',
        city: '',
        state: '',
        zip_code: '',
      },
    };
    setFormData({
      ...formData,
      stops: [...formData.stops, newStop],
    });
  };

  const removeStop = (index: number) => {
    if (formData.stops.length <= 1) return;
    const newStops = formData.stops.filter((_, i) => i !== index);
    // Renumber sequence
    newStops.forEach((stop, i) => {
      stop.sequence_number = i + 1;
    });
    setFormData({
      ...formData,
      stops: newStops,
    });
  };

  const updateStop = (index: number, field: keyof StopFormData, value: any) => {
    const newStops = [...formData.stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setFormData({ ...formData, stops: newStops });
  };

  const updateStopAddress = (stopIndex: number, field: keyof AddressFormData, value: any) => {
    const newStops = [...formData.stops];
    newStops[stopIndex].address = { ...newStops[stopIndex].address, [field]: value };
    setFormData({ ...formData, stops: newStops });
  };

  const updateStopAddressBulk = (stopIndex: number, addressUpdates: Partial<AddressFormData>) => {
    const newStops = [...formData.stops];
    newStops[stopIndex].address = { ...newStops[stopIndex].address, ...addressUpdates };
    setFormData({ ...formData, stops: newStops });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.customer_id || !formData.equipment_type_id) {
        throw new Error('Please select a customer and equipment type');
      }

      if (formData.stops.length < 2) {
        throw new Error('At least 2 stops are required (pickup and delivery)');
      }

      // Ensure all stops have required address fields
      for (const stop of formData.stops) {
        if (!stop.address.location_name || !stop.address.street || !stop.address.city || !stop.address.state || !stop.address.zip_code) {
          throw new Error('All stops must have complete address information');
        }
      }

      // Convert datetime-local format to ISO format for backend
      const formattedData: OrderFormData = {
        ...formData,
        stops: formData.stops.map(stop => ({
          ...stop,
          scheduled_arrival_early: stop.scheduled_arrival_early 
            ? new Date(stop.scheduled_arrival_early).toISOString() 
            : undefined,
          scheduled_arrival_late: stop.scheduled_arrival_late 
            ? new Date(stop.scheduled_arrival_late).toISOString() 
            : undefined,
        })),
      };

      await createOrder(formattedData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const clearAllFields = () => {
    setFormData({
      stops: [
        {
          stop_type: 'PICKUP',
          sequence_number: 1,
          address: {
            location_name: '',
            street: '',
            city: '',
            state: '',
            zip_code: '',
          },
        },
      ],
      load: {
        weight_lbs: 0,
        commodity: '',
      },
      quotation: {
        miles: 0,
        rate: 0,
        currency: 'USD',
      },
    });
    setSearchCustomer('');
    setSearchEquipment('');
    setSelectedCustomerName('');
    setSelectedEquipmentName('');
    setShowCustomerDropdown(false);
    setShowEquipmentDropdown(false);
  };

  // Get locations for map
  const mapLocations = formData.stops
    .filter(stop => stop.address.latitude && stop.address.longitude)
    .map(stop => ({
      name: stop.address.location_name || stop.address.city || 'Unknown',
      lat: stop.address.latitude!,
      lng: stop.address.longitude!,
      type: stop.stop_type,
    }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white w-full max-w-7xl my-8 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 text-yellow-900 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Create New Order</h2>
              <p className="text-blue-100 text-sm">Manually create a new order with pickup and delivery details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearAllFields}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear All Fields
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Error creating order:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Info Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 text-white rounded-full p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Order Info</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Customer */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type to search customers..."
                  value={selectedCustomerName || searchCustomer}
                  onChange={(e) => {
                    setSearchCustomer(e.target.value);
                    setSelectedCustomerName('');
                    setFormData({ ...formData, customer_id: undefined });
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                    {customers.map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, customer_id: customer.id });
                          setSelectedCustomerName(customer.name);
                          setSearchCustomer('');
                          setShowCustomerDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                {searchCustomer.length > 0 && searchCustomer.length < 2 && (
                  <p className="text-xs text-gray-500 mt-1">Type at least 2 characters to search</p>
                )}
              </div>

              {/* Equipment Type */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type to search equipment types..."
                  value={selectedEquipmentName || searchEquipment}
                  onChange={(e) => {
                    setSearchEquipment(e.target.value);
                    setSelectedEquipmentName('');
                    setFormData({ ...formData, equipment_type_id: undefined });
                  }}
                  onFocus={() => setShowEquipmentDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showEquipmentDropdown && equipmentTypes.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                    {equipmentTypes.map(equipment => (
                      <button
                        key={equipment.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, equipment_type_id: equipment.id });
                          setSelectedEquipmentName(equipment.name);
                          setSearchEquipment('');
                          setShowEquipmentDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{equipment.name}</div>
                        {equipment.description && (
                          <div className="text-xs text-gray-500">{equipment.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {searchEquipment.length > 0 && searchEquipment.length < 2 && (
                  <p className="text-xs text-gray-500 mt-1">Type at least 2 characters to search</p>
                )}
              </div>
            </div>
          </div>

          {/* Stops Section */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-purple-600 text-white rounded-full p-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Stops</h3>
              </div>
              <button
                type="button"
                onClick={addStop}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Stop
              </button>
            </div>

            <div className="space-y-4">
              {formData.stops.map((stop, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-700">
                        Stop #{index + 1}
                      </span>
                      <select
                        value={stop.stop_type}
                        onChange={(e) => updateStop(index, 'stop_type', e.target.value as 'PICKUP' | 'DELIVERY')}
                        className={`px-2 py-1 rounded text-xs font-medium border-0 focus:ring-2 focus:ring-purple-500 cursor-pointer ${
                          stop.stop_type === 'PICKUP' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <option value="PICKUP">PICKUP</option>
                        <option value="DELIVERY">DELIVERY</option>
                      </select>
                    </div>
                    {formData.stops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Address Autocomplete Search */}
                  <div className="mb-3 pb-3 border-b border-purple-200">
                    <AddressAutocomplete
                      stopIndex={index}
                      address={stop.address}
                      onAddressUpdate={updateStopAddressBulk}
                    />
                    <p className="text-xs text-gray-500 mt-1 italic">
                      💡 Tip: Search for an address above, or manually fill in the fields below
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Location Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter location name"
                        value={stop.address.location_name}
                        onChange={(e) => updateStopAddress(index, 'location_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter street address"
                        value={stop.address.street}
                        onChange={(e) => updateStopAddress(index, 'street', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          ZIP Code <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter ZIP"
                            maxLength={10}
                            value={stop.address.zip_code}
                            onChange={(e) => updateStopAddress(index, 'zip_code', e.target.value)}
                            onBlur={(e) => lookupZipCode(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                            required
                          />
                          {zipLookupLoading[index] && (
                            <div className="absolute right-2 top-2">
                              <svg className="animate-spin h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Auto-fills city/state</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Auto-filled or enter"
                          value={stop.address.city}
                          onChange={(e) => updateStopAddress(index, 'city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-gray-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={stop.address.state}
                          onChange={(e) => updateStopAddress(index, 'state', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 bg-white cursor-pointer"
                          required
                        >
                          <option value="">Select State</option>
                          {US_STATES.map(state => (
                            <option key={state.code} value={state.code}>
                              {state.code} - {state.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scheduled Arrival (Early)
                      </label>
                      <input
                        type="datetime-local"
                        value={stop.scheduled_arrival_early || ''}
                        onChange={(e) => updateStop(index, 'scheduled_arrival_early', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scheduled Arrival (Late)
                      </label>
                      <input
                        type="datetime-local"
                        value={stop.scheduled_arrival_late || ''}
                        onChange={(e) => updateStop(index, 'scheduled_arrival_late', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipment Details & Map Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            {/* Shipment Details */}
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-orange-600 text-white rounded-full p-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Shipment Details</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight (lbs)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.load?.weight_lbs || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        load: { ...formData.load, weight_lbs: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Miles</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.quotation?.miles || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        quotation: { ...formData.quotation, miles: parseInt(e.target.value) || 0, currency: 'USD' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rate ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.quotation?.rate || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        quotation: { ...formData.quotation, rate: parseFloat(e.target.value) || 0, currency: 'USD' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Commodity</label>
                  <input
                    type="text"
                    placeholder="Enter commodity"
                    value={formData.load?.commodity || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      load: { ...formData.load, commodity: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Map Preview */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-green-600 text-white rounded-full p-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Route Preview</h3>
              </div>
              <RouteMapPreview locations={mapLocations} className="h-64" />
            </div>
          </div>

          {/* Reference Numbers */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gray-600 text-white rounded-full p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reference Numbers</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                <input
                  type="text"
                  disabled
                  placeholder="Your TMS will generate Order ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bill of Lading #</label>
                <input
                  type="text"
                  placeholder="Enter BOL number"
                  value={formData.bill_of_lading_number || ''}
                  onChange={(e) => setFormData({ ...formData, bill_of_lading_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipment ID</label>
                <input
                  type="text"
                  placeholder="Enter shipment ID"
                  value={formData.shipment_id || ''}
                  onChange={(e) => setFormData({ ...formData, shipment_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-600 text-white rounded-full p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BOL Notes</label>
              <textarea
                placeholder="Enter any additional notes..."
                value={formData.bol_notes || ''}
                onChange={(e) => setFormData({ ...formData, bol_notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.customer_id || !formData.equipment_type_id}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

