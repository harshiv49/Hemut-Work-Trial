'use client';

import { useState, useEffect } from 'react';
import { LaneAccessory, LaneCalculation } from '../types/lane';

interface LaneCalculatorProps {
  baseRate?: number;
  onCalculationChange?: (calculation: LaneCalculation) => void;
}

export default function LaneCalculator({
  baseRate,
  onCalculationChange,
}: LaneCalculatorProps) {
  const [calculation, setCalculation] = useState<LaneCalculation>({
    base_rate: baseRate || 0,
    accessories: [],
    margin_percentage: 0,
    margin_amount: 0,
    subtotal: 0,
    total: 0,
  });

  const [availableAccessories] = useState<LaneAccessory[]>([
    {
      id: 1,
      name: 'Fuel Surcharge',
      description: 'Current fuel surcharge',
      cost: 15,
      is_percentage: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Insurance',
      description: 'Cargo insurance',
      cost: 100,
      is_percentage: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Lift Gate Service',
      description: 'Lift gate at pickup/delivery',
      cost: 75,
      is_percentage: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 4,
      name: 'Inside Delivery',
      description: 'Delivery inside building',
      cost: 50,
      is_percentage: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [marginPercentage, setMarginPercentage] = useState(0);

  // Recalculate when base rate, accessories, or margin changes
  useEffect(() => {
    try {
      const baseRate = Number(calculation.base_rate) || 0;
      let subtotal = baseRate;

      // Calculate accessories cost
      const accessoriesWithAmounts = calculation.accessories.map((acc) => {
        const cost = Number(acc.cost) || 0;
        const calculatedAmount = acc.is_percentage
          ? (baseRate * cost) / 100
          : cost;
        subtotal = subtotal + calculatedAmount;
        return { ...acc, calculated_amount: calculatedAmount };
      });

      // Calculate margin
      const margin = Number(marginPercentage) || 0;
      const marginAmount = Number(((subtotal * margin) / 100).toFixed(2));
      const total = Number((subtotal + marginAmount).toFixed(2));

      // Only update if values actually changed to prevent infinite loop
      if (
        calculation.subtotal !== subtotal ||
        calculation.margin_amount !== marginAmount ||
        calculation.total !== total ||
        JSON.stringify(calculation.accessories) !== JSON.stringify(accessoriesWithAmounts)
      ) {
        const newCalculation = {
          base_rate: baseRate,
          accessories: accessoriesWithAmounts,
          margin_percentage: margin,
          margin_amount: marginAmount,
          subtotal,
          total,
        };

        setCalculation(newCalculation);
        onCalculationChange?.(newCalculation);
      }
    } catch (error) {
      console.error('Error calculating lane cost:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculation.base_rate, calculation.accessories.length, marginPercentage]);

  const toggleAccessory = (accessory: LaneAccessory) => {
    try {
      const exists = calculation.accessories.find((a) => a.accessory_id === accessory.id);
      
      if (exists) {
        setCalculation({
          ...calculation,
          accessories: calculation.accessories.filter((a) => a.accessory_id !== accessory.id),
        });
      } else {
        setCalculation({
          ...calculation,
          accessories: [
            ...calculation.accessories,
            {
              accessory_id: accessory.id,
              name: accessory.name,
              cost: accessory.cost,
              is_percentage: accessory.is_percentage,
              calculated_amount: 0,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error toggling accessory:', error);
    }
  };

  const isAccessorySelected = (accessoryId: number) => {
    return calculation.accessories.some((a) => a.accessory_id === accessoryId);
  };

  return (
    <div className="space-y-6">
      {/* Base Rate Input */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="bg-[#F4B223]/10 dark:bg-[#F4B223]/20 text-[#F4B223] rounded-lg p-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          Base Rate
        </h3>
        <input
          type="text"
          value={calculation.base_rate && calculation.base_rate > 0 ? calculation.base_rate : ''}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, '');
            setCalculation({
              ...calculation,
              base_rate: parseFloat(value) || 0,
            });
          }}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-lg font-semibold focus:ring-2 focus:ring-[#F4B223] focus:border-transparent text-foreground"
          placeholder="TBD - Enter base rate"
        />
      </div>

      {/* Accessories */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="bg-[#F4B223]/10 dark:bg-[#F4B223]/20 text-[#F4B223] rounded-lg p-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          Accessories & Add-ons
        </h3>
        <div className="space-y-2">
          {availableAccessories.map((accessory) => {
            const selected = isAccessorySelected(accessory.id);
            const selectedAccessory = calculation.accessories.find(
              (a) => a.accessory_id === accessory.id
            );
            
            return (
              <button
                key={accessory.id}
                type="button"
                onClick={() => toggleAccessory(accessory)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selected
                    ? 'border-[#F4B223] bg-[#F4B223]/10 dark:bg-[#F4B223]/20'
                    : 'border-border bg-muted/50 hover:border-[#F4B223]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-foreground flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selected
                            ? 'border-[#F4B223] bg-[#F4B223]'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {selected && (
                          <svg
                            className="w-3 h-3 text-gray-900"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      {accessory.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {accessory.description}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold text-foreground">
                      {accessory.is_percentage
                        ? `${accessory.cost}%`
                        : `$${Number(accessory.cost).toFixed(2)}`}
                    </div>
                    {selected && selectedAccessory && (
                      <div className="text-xs text-[#F4B223]">
                        = ${Number(selectedAccessory.calculated_amount).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Margin */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="bg-[#F4B223]/10 dark:bg-[#F4B223]/20 text-[#F4B223] rounded-lg p-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          Margin
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={marginPercentage}
            onChange={(e) => setMarginPercentage(parseInt(e.target.value) || 0)}
            className="w-32 px-4 py-2 bg-background border border-border rounded-lg font-semibold focus:ring-2 focus:ring-[#F4B223] focus:border-transparent text-foreground"
            placeholder="0"
          />
          <span className="text-foreground font-medium">%</span>
          <div className="flex-1 text-right">
            <span className="text-muted-foreground mr-2">Margin Amount:</span>
            <span className="text-lg font-semibold text-[#F4B223]">
              ${Number(calculation.margin_amount || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-[#F4B223]/10 to-[#F4B223]/5 dark:from-[#F4B223]/20 dark:to-[#F4B223]/10 border-2 border-[#F4B223] rounded-lg p-6">
        <div className="space-y-3">
          <div className="flex justify-between text-foreground">
            <span>Base Rate:</span>
            <span className="font-semibold">
              {!calculation.base_rate || calculation.base_rate === 0 
                ? 'TBD' 
                : `$${Number(calculation.base_rate).toFixed(2)}`}
            </span>
          </div>
          {calculation.accessories.length > 0 && (
            <div className="flex justify-between text-foreground">
              <span>Accessories:</span>
              <span className="font-semibold">
                {!calculation.base_rate || calculation.base_rate === 0 
                  ? 'TBD' 
                  : `$${Number(
                      calculation.accessories
                        .reduce((sum, acc) => sum + (acc.calculated_amount || 0), 0)
                    ).toFixed(2)}`}
              </span>
            </div>
          )}
          <div className="flex justify-between text-foreground border-t border-[#F4B223]/30 pt-2">
            <span>Subtotal:</span>
            <span className="font-semibold">
              {!calculation.base_rate || calculation.base_rate === 0 
                ? 'TBD' 
                : `$${Number(calculation.subtotal).toFixed(2)}`}
            </span>
          </div>
          {calculation.margin_percentage > 0 && (
            <div className="flex justify-between text-foreground">
              <span>Margin ({calculation.margin_percentage}%):</span>
              <span className="font-semibold">
                {!calculation.base_rate || calculation.base_rate === 0 
                  ? 'TBD' 
                  : `$${Number(calculation.margin_amount).toFixed(2)}`}
              </span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-bold text-foreground border-t-2 border-[#F4B223] pt-3">
            <span>Total:</span>
            <span className="text-[#F4B223]">
              {!calculation.base_rate || calculation.base_rate === 0 
                ? 'TBD' 
                : `$${Number(calculation.total).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

