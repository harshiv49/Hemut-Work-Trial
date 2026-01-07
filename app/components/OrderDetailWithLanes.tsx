'use client';

import { useState } from 'react';
import { Order } from '../types/order';
import LaneHistoryView from './LaneHistoryView';
import LaneCalculator from './LaneCalculator';
import { LaneCalculation } from '../types/lane';

interface OrderDetailWithLanesProps {
  order: Order;
}

type TabType = 'load' | 'customer' | 'lane-history' | 'calculator';

export default function OrderDetailWithLanes({ order }: OrderDetailWithLanesProps) {
  const [activeTab, setActiveTab] = useState<TabType>('load');
  const [laneCalculation, setLaneCalculation] = useState<LaneCalculation | null>(null);

  // Extract origin and destination from stops
  const originStop = order.stops?.[0];
  const destinationStop = order.stops?.[order.stops.length - 1];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'load', label: 'Load Details' },
    { id: 'customer', label: 'Customer Details' },
    { id: 'lane-history', label: 'Lane History' },
    { id: 'calculator', label: 'Calculator' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg">
      {/* Tabs */}
      <div className="border-b border-border bg-muted/30">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-semibold text-sm transition-all relative ${
                activeTab === tab.id
                  ? 'text-gray-900 bg-[#F4B223]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F4B223]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'load' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="bg-[#F4B223] text-gray-900 rounded-lg p-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              </div>
              Load Details
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Weight</div>
                  <div className="text-lg font-semibold text-foreground">
                    {order.load?.weight_lbs || 0} lbs
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Commodity</div>
                  <div className="text-lg font-semibold text-foreground">
                    {order.load?.commodity || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Miles</div>
                  <div className="text-lg font-semibold text-foreground">
                    {order.quotation?.miles || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rate</div>
                  <div className="text-lg font-semibold text-foreground">
                    {order.quotation?.rate != null
                      ? `$${order.quotation.rate.toFixed(2)}` 
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="bg-[#F4B223] text-gray-900 rounded-lg p-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              Customer Details
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Customer Name</div>
                <div className="text-lg font-semibold text-foreground">
                  {order.customer?.name || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="text-lg font-semibold text-foreground">
                  {order.customer?.email || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lane-history' && originStop && destinationStop && (
          <LaneHistoryView
            originCity={originStop.address?.city || ''}
            originState={originStop.address?.state || ''}
            destinationCity={destinationStop.address?.city || ''}
            destinationState={destinationStop.address?.state || ''}
            equipmentType={order.equipment_type?.name || 'N/A'}
            laneId={undefined} // TODO: Get from order.lane_id when implemented
          />
        )}

        {activeTab === 'calculator' && (
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <div className="bg-[#F4B223] text-gray-900 rounded-lg p-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
             Billing Calculator
            </h3>
            <LaneCalculator
              baseRate={order.quotation?.rate ?? undefined}
              onCalculationChange={setLaneCalculation}
            />
            
            {laneCalculation && (
              <div className="mt-6">
                <button
                  className="w-full px-6 py-3 bg-[#F4B223] text-gray-900 font-bold rounded-lg hover:bg-[#E5A420] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Lane Pricing
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

