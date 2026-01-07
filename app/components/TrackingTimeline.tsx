'use client';

import { TrackingEvent } from '../types/order';
import { useEffect, useState } from 'react';

interface TrackingTimelineProps {
  orderId: number;
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  NOT_REACHED: {
    icon: '🔵',
    color: 'bg-blue-500',
    label: 'En Route'
  },
  ARRIVED: {
    icon: '📍',
    color: 'bg-purple-500',
    label: 'Arrived'
  },
  LOADING: {
    icon: '📦',
    color: 'bg-yellow-500',
    label: 'Loading'
  },
  UNLOADING: {
    icon: '📤',
    color: 'bg-orange-500',
    label: 'Unloading'
  },
  DEPARTED: {
    icon: '🚚',
    color: 'bg-green-500',
    label: 'Departed'
  },
  // Legacy statuses for backward compatibility
  ORDER_RECEIVED: {
    icon: '📋',
    color: 'bg-blue-500',
    label: 'Order Received'
  },
  PICKED_UP: {
    icon: '📦',
    color: 'bg-purple-500',
    label: 'Picked Up'
  },
  IN_TRANSIT: {
    icon: '🚚',
    color: 'bg-yellow-500',
    label: 'In Transit'
  },
  OUT_FOR_DELIVERY: {
    icon: '🚛',
    color: 'bg-orange-500',
    label: 'Out for Delivery'
  },
  DELIVERED: {
    icon: '✅',
    color: 'bg-green-500',
    label: 'Delivered'
  },
  EXCEPTION: {
    icon: '⚠️',
    color: 'bg-red-500',
    label: 'Exception'
  }
};

export default function TrackingTimeline({ orderId }: TrackingTimelineProps) {
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrackingEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:8000/orders/${orderId}/tracking`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tracking events: ${response.statusText}`);
        }
        
        const data = await response.json();
        setTrackingEvents(data);
      } catch (err) {
        console.error('Error fetching tracking events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tracking events');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchTrackingEvents();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchTrackingEvents, 10000);
      
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return {
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      };
    } catch (e) {
      return { date: 'Invalid date', time: '' };
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || {
      icon: '📍',
      color: 'bg-gray-500',
      label: status.replace(/_/g, ' ')
    };
  };

  if (loading && trackingEvents.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">📍</span>
          Tracking Information
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4B223]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">📍</span>
          Tracking Information
        </h3>
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (trackingEvents.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">📍</span>
          Tracking Information
        </h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No tracking events available yet</p>
          <p className="text-muted-foreground text-xs mt-2">
            Tracking updates will appear here as the order progresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
        <span className="text-2xl">📍</span>
        Tracking Information
      </h3>

      {/* Current Status Badge */}
      {trackingEvents.length > 0 && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getStatusConfig(trackingEvents[0].status).icon}</span>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Current Status</div>
              <div className="text-lg font-semibold text-foreground">
                {getStatusConfig(trackingEvents[0].status).label}
              </div>
              {trackingEvents[0].location && (
                <div className="text-sm text-muted-foreground mt-1">
                  📍 {trackingEvents[0].location}
                </div>
              )}
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {formatTimestamp(trackingEvents[0].timestamp).date}
              <br />
              {formatTimestamp(trackingEvents[0].timestamp).time}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border"></div>

        {/* Events */}
        <div className="space-y-6">
          {trackingEvents.map((event, index) => {
            const config = getStatusConfig(event.status);
            const { date, time } = formatTimestamp(event.timestamp);
            const isLatest = index === 0;

            return (
              <div key={event.id} className="relative pl-12">
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white shadow-lg ${
                    isLatest ? 'ring-4 ring-[#F4B223]/30' : ''
                  }`}
                >
                  <span className="text-lg">{config.icon}</span>
                </div>

                {/* Event content */}
                <div className={`bg-muted/30 rounded-lg p-4 border ${isLatest ? 'border-[#F4B223]/50' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{config.label}</h4>
                      {event.stop_id && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Stop #{event.stop_id}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-foreground">{date}</div>
                      <div className="text-xs text-muted-foreground">{time}</div>
                    </div>
                  </div>

                  {event.location && (
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                  )}

                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}

                  {event.latitude && event.longitude && (
                    <div className="text-xs text-muted-foreground/60 mt-2">
                      Coordinates: {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Auto-refreshing every 10 seconds
        </p>
      </div>
    </div>
  );
}

