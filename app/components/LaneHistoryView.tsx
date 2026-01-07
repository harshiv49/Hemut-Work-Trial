'use client';

import { useState, useEffect } from 'react';
import { Lane, LaneHistoryItem } from '../types/lane';

interface LaneHistoryViewProps {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  equipmentType: string;
  laneId?: number;
}

export default function LaneHistoryView({
  originCity,
  originState,
  destinationCity,
  destinationState,
  equipmentType,
  laneId,
}: LaneHistoryViewProps) {
  const [historyData, setHistoryData] = useState<LaneHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch lane history from API
    // For now, show empty state
    const fetchLaneHistory = async () => {
      try {
        setLoading(true);
        // const response = await fetch(`/api/lanes/${laneId}/history`);
        // const data = await response.json();
        // setHistoryData(data.history);
        setHistoryData([]);
      } catch (error) {
        console.error('Error fetching lane history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (laneId) {
      fetchLaneHistory();
    }
  }, [laneId]);

  return (
    <div className="space-y-4">
      {/* Lane Summary Card */}
      <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-[#F4B223]/10 dark:bg-[#F4B223]/20 text-[#F4B223] rounded-full p-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <div className="text-xl font-bold text-foreground uppercase">
                {originCity}, {originState}
              </div>
              <div className="text-sm text-muted-foreground">Origin</div>
            </div>

            <div className="text-[#F4B223]">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>

            <div>
              <div className="text-xl font-bold text-foreground uppercase">
                {destinationCity}, {destinationState}
              </div>
              <div className="text-sm text-muted-foreground">Destination</div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-foreground">
            {equipmentType}
          </div>
          <div className="text-sm text-muted-foreground">Equipment</div>
        </div>
      </div>

      {/* History Data Section */}
      <div className="bg-card border border-border rounded-lg p-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-[#F4B223]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : historyData.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-4">
              <svg
                className="w-10 h-10 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Historical Data
            </h3>
            <p className="text-muted-foreground">
              No past bids found for this lane
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyData.map((item) => (
              <div
                key={item.id}
                className="bg-muted/50 rounded-lg p-4 border border-border hover:border-[#F4B223] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">
                      Order #{item.order_id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(item.quoted_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      ${item.lane_pricing.total_cost.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.accepted ? (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ Accepted
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          ✗ Declined
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

