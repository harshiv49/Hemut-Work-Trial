'use client';

import { useEffect, useState } from 'react';

interface LaneHistoryRecord {
  id: number;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  equipment_type: string | null;
  miles: number | null;
  rate: string;
  rate_per_mile: string | null;
  weight_lbs: number | null;
  commodity: string | null;
  shipment_date: string | null;
  carrier_name: string | null;
  created_at: string;
}

interface LaneStatistics {
  avg_rate: string;
  min_rate: string;
  max_rate: string;
  avg_rate_per_mile: string | null;
  total_shipments: number;
  recent_shipments: number;
}

interface LaneHistoryProps {
  originCity?: string;
  originState?: string;
  destCity?: string;
  destState?: string;
  equipmentType?: string;
}

export default function LaneHistory({
  originCity,
  originState,
  destCity,
  destState,
  equipmentType
}: LaneHistoryProps) {
  const [history, setHistory] = useState<LaneHistoryRecord[]>([]);
  const [statistics, setStatistics] = useState<LaneStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLaneData = async () => {
      if (!originCity || !originState || !destCity || !destState) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          origin_city: originCity,
          origin_state: originState,
          dest_city: destCity,
          dest_state: destState,
        });

        if (equipmentType) {
          params.append('equipment_type', equipmentType);
        }

        // Fetch history and statistics in parallel
        const [historyRes, statsRes] = await Promise.all([
          fetch(`http://localhost:8000/lanes/history?${params}`),
          fetch(`http://localhost:8000/lanes/statistics?${params}`)
        ]);

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStatistics(statsData);
        }
      } catch (err) {
        console.error('Error fetching lane data:', err);
        setError('Failed to load lane history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLaneData();
  }, [originCity, originState, destCity, destState, equipmentType]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  if (!originCity || !destCity) {
    return (
      <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#F4B223]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Lane History
        </h3>
        <p className="text-sm text-muted-foreground">No route information available</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg border border-border p-3 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-[#F4B223]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Lane History
        </h3>
        <span className="text-xs text-muted-foreground">
          {originCity}, {originState} → {destCity}, {destState}
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">Loading lane data...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive py-4">{error}</div>
      )}

      {!isLoading && !error && (
        <>
          {/* Statistics Summary */}
          {statistics && statistics.total_shipments > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Avg Rate</label>
                <p className="text-sm font-bold text-foreground">${parseFloat(statistics.avg_rate).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Min Rate</label>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(statistics.min_rate).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Max Rate</label>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">${parseFloat(statistics.max_rate).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Shipments</label>
                <p className="text-sm font-bold text-foreground">{statistics.total_shipments}</p>
              </div>
            </div>
          )}

          {/* Historical Records */}
          {history.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((record) => (
                <div key={record.id} className="p-3 bg-muted/20 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {record.equipment_type && (
                          <span className="text-xs font-medium px-2 py-0.5 bg-[#F4B223]/10 text-[#D69E1F] rounded">
                            {record.equipment_type}
                          </span>
                        )}
                        {record.commodity && (
                          <span className="text-xs text-muted-foreground">{record.commodity}</span>
                        )}
                      </div>
                      {record.carrier_name && (
                        <p className="text-xs text-muted-foreground">{record.carrier_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">${parseFloat(record.rate).toFixed(2)}</p>
                      {record.rate_per_mile && (
                        <p className="text-xs text-muted-foreground">${parseFloat(record.rate_per_mile).toFixed(2)}/mi</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{record.weight_lbs ? `${record.weight_lbs.toLocaleString()} lbs` : 'N/A'}</span>
                    <span>{formatDate(record.shipment_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No historical data available for this lane</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

