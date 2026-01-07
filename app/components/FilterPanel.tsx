'use client';

import { useEffect, useState } from 'react';

interface FilterPanelProps {
  onFiltersChange: (filters: OrderFilters) => void;
  onClose: () => void;
}

export interface OrderFilters {
  statusIds: number[];
  equipmentTypeIds: number[];
  pickupDateFrom: string;
  pickupDateTo: string;
  deliveryDateFrom: string;
  deliveryDateTo: string;
}

interface StatusType {
  id: number;
  name: string;
}

interface EquipmentType {
  id: number;
  name: string;
  description?: string;
}

export default function FilterPanel({ onFiltersChange, onClose }: FilterPanelProps) {
  const [statuses, setStatuses] = useState<StatusType[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  
  const [selectedStatusIds, setSelectedStatusIds] = useState<number[]>([]);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>([]);
  const [pickupDateFrom, setPickupDateFrom] = useState('');
  const [pickupDateTo, setPickupDateTo] = useState('');
  const [deliveryDateFrom, setDeliveryDateFrom] = useState('');
  const [deliveryDateTo, setDeliveryDateTo] = useState('');

  // Fetch available statuses and equipment types
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [statusesRes, equipmentRes] = await Promise.all([
          fetch('http://localhost:8000/orders/filters/statuses'),
          fetch('http://localhost:8000/orders/filters/equipment-types'),
        ]);
        
        if (statusesRes.ok) {
          const statusesData = await statusesRes.json();
          setStatuses(statusesData);
        }
        
        if (equipmentRes.ok) {
          const equipmentData = await equipmentRes.json();
          setEquipmentTypes(equipmentData);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleStatusToggle = (statusId: number) => {
    try {
      setSelectedStatusIds((prev) =>
        prev.includes(statusId)
          ? prev.filter((id) => id !== statusId)
          : [...prev, statusId]
      );
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleEquipmentToggle = (equipmentId: number) => {
    try {
      setSelectedEquipmentIds((prev) =>
        prev.includes(equipmentId)
          ? prev.filter((id) => id !== equipmentId)
          : [...prev, equipmentId]
      );
    } catch (error) {
      console.error('Error toggling equipment:', error);
    }
  };

  const handleApplyFilters = () => {
    try {
      onFiltersChange({
        statusIds: selectedStatusIds,
        equipmentTypeIds: selectedEquipmentIds,
        pickupDateFrom,
        pickupDateTo,
        deliveryDateFrom,
        deliveryDateTo,
      });
      onClose();
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleResetFilters = () => {
    try {
      setSelectedStatusIds([]);
      setSelectedEquipmentIds([]);
      setPickupDateFrom('');
      setPickupDateTo('');
      setDeliveryDateFrom('');
      setDeliveryDateTo('');
      onFiltersChange({
        statusIds: [],
        equipmentTypeIds: [],
        pickupDateFrom: '',
        pickupDateTo: '',
        deliveryDateFrom: '',
        deliveryDateTo: '',
      });
    } catch (error) {
      console.error('Error resetting filters:', error);
    }
  };

  const formatStatusName = (name: string) => {
    return name === 'IN_TRANSIT' ? 'In Transit' : 
           name === 'CREATED' ? 'No Connection' : 
           name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const activeFilterCount = selectedStatusIds.length + selectedEquipmentIds.length + 
    (pickupDateFrom ? 1 : 0) + (pickupDateTo ? 1 : 0) + 
    (deliveryDateFrom ? 1 : 0) + (deliveryDateTo ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md mt-16 max-h-[calc(100vh-8rem)] flex flex-col border border-border">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[#F4B223] text-gray-900 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Status Filter */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Order Status</h3>
            <div className="space-y-2">
              {statuses.map((status) => (
                <label
                  key={status.id}
                  className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatusIds.includes(status.id)}
                    onChange={() => handleStatusToggle(status.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#F4B223] focus:ring-[#F4B223] focus:ring-offset-0"
                  />
                  <span className="text-sm text-foreground">{formatStatusName(status.name)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Equipment Type Filter */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Equipment Type</h3>
            <div className="space-y-2">
              {equipmentTypes.map((equipment) => (
                <label
                  key={equipment.id}
                  className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedEquipmentIds.includes(equipment.id)}
                    onChange={() => handleEquipmentToggle(equipment.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#F4B223] focus:ring-[#F4B223] focus:ring-offset-0"
                  />
                  <span className="text-sm text-foreground">{equipment.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pickup Date Range */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Pickup Date</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <input
                  type="date"
                  value={pickupDateFrom}
                  onChange={(e) => setPickupDateFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <input
                  type="date"
                  value={pickupDateTo}
                  onChange={(e) => setPickupDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Delivery Date Range */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Delivery Date</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <input
                  type="date"
                  value={deliveryDateFrom}
                  onChange={(e) => setDeliveryDateFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <input
                  type="date"
                  value={deliveryDateTo}
                  onChange={(e) => setDeliveryDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex gap-3">
          <button
            onClick={handleResetFilters}
            className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-accent rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-900 bg-[#F4B223] hover:bg-[#E5A420] rounded-lg transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

