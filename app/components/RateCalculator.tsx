'use client';

import { useState, useEffect } from 'react';

interface RateCalculatorProps {
  initialMiles?: number;
  initialWeight?: number;
  initialCommodity?: string;
}

export default function RateCalculator({ 
  initialMiles = 0, 
  initialWeight = 0,
  initialCommodity = ''
}: RateCalculatorProps) {
  const [miles, setMiles] = useState(initialMiles);
  const [weight, setWeight] = useState(initialWeight);
  const [commodity, setCommodity] = useState(initialCommodity);
  const [ratePerMile, setRatePerMile] = useState(2.50);
  const [fuelSurcharge, setFuelSurcharge] = useState(15); // percentage
  const [accessorialFees, setAccessorialFees] = useState(0);

  // Update when props change
  useEffect(() => {
    try {
      setMiles(initialMiles);
      setWeight(initialWeight);
      setCommodity(initialCommodity);
    } catch (error) {
      console.error('Error updating calculator values:', error);
    }
  }, [initialMiles, initialWeight, initialCommodity]);

  const calculateRate = () => {
    try {
      const baseRate = miles * ratePerMile;
      const fuelCost = baseRate * (fuelSurcharge / 100);
      const totalRate = baseRate + fuelCost + accessorialFees;
      return {
        baseRate: baseRate.toFixed(2),
        fuelCost: fuelCost.toFixed(2),
        totalRate: totalRate.toFixed(2),
        ratePerMile: ratePerMile.toFixed(2)
      };
    } catch (error) {
      console.error('Error calculating rate:', error);
      return {
        baseRate: '0.00',
        fuelCost: '0.00',
        totalRate: '0.00',
        ratePerMile: '0.00'
      };
    }
  };

  const rates = calculateRate();

  return (
    <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-[#F4B223]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Rate Calculator
        </h3>
      </div>

      <div className="space-y-4">
        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Miles
            </label>
            <input
              type="number"
              value={miles}
              onChange={(e) => setMiles(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground"
              placeholder="Enter miles"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Weight (lbs)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground"
              placeholder="Enter weight"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Rate per Mile ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={ratePerMile}
              onChange={(e) => setRatePerMile(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground"
              placeholder="Enter rate per mile"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Fuel Surcharge (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={fuelSurcharge}
              onChange={(e) => setFuelSurcharge(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground"
              placeholder="Enter fuel surcharge %"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Accessorial Fees ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={accessorialFees}
              onChange={(e) => setAccessorialFees(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4B223] text-foreground"
              placeholder="Enter accessorial fees"
            />
          </div>
        </div>

        {/* Calculation Results */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Base Rate:</span>
            <span className="text-sm font-semibold text-foreground">${rates.baseRate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Fuel Surcharge ({fuelSurcharge}%):</span>
            <span className="text-sm font-semibold text-foreground">${rates.fuelCost}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Accessorial Fees:</span>
            <span className="text-sm font-semibold text-foreground">${accessorialFees.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-foreground">Total Estimated Rate:</span>
            <span className="text-lg font-bold text-[#F4B223]">${rates.totalRate}</span>
          </div>
          <div className="text-xs text-muted-foreground text-center pt-2">
            Average: ${rates.ratePerMile}/mile
          </div>
        </div>
      </div>
    </div>
  );
}

