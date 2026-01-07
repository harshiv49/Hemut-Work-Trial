'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Order } from '../types/order';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Component to fit map bounds to show all locations
function MapBounds({ locations, route }: { locations: { lat: number; lng: number }[]; route: [number, number][] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length === 0) return;
    
    if (route && route.length > 0) {
      // Fit bounds to include the route
      const bounds = L.latLngBounds(route as [number, number][]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Fallback: fit bounds to markers
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.lat, loc.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, locations, route]);

  return null;
}

export default function MapView({ order }: { order: Order }) {
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract locations from order stops
  const locations = order.stops
    ? order.stops
        .filter(stop => stop.address?.latitude && stop.address?.longitude)
        .sort((a, b) => a.sequence_number - b.sequence_number)
        .map(stop => ({
          name: stop.address?.location_name || stop.address?.city || 'Unknown',
          lat: parseFloat(stop.address?.latitude || '0'),
          lng: parseFloat(stop.address?.longitude || '0'),
          type: stop.stop_type?.name || 'UNKNOWN',
          address: stop.address,
          sequence: stop.sequence_number,
        }))
    : [];

  useEffect(() => {
    if (locations.length < 2) {
      setRoute(null);
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build OSRM API URL with all locations
        const coordinates = locations
          .map(loc => `${loc.lng},${loc.lat}`)
          .join(';');
        
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          // Convert GeoJSON coordinates to [lat, lng] format for Leaflet
          const coords = data.routes[0].geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number]
          );
          setRoute(coords);
        } else {
          // Fallback to straight lines between locations
          const straightLine = locations.map(loc => [loc.lat, loc.lng] as [number, number]);
          setRoute(straightLine);
        }
      } catch (err) {
        console.error('Error fetching route:', err);
        setError('Failed to fetch route, showing straight lines');
        // Fallback to straight lines
        const straightLine = locations.map(loc => [loc.lat, loc.lng] as [number, number]);
        setRoute(straightLine);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [order.id]); // Re-fetch when order changes

  if (locations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-lg font-medium">No location data available</p>
          <p className="text-sm mt-1">This order doesn't have valid coordinates for mapping</p>
        </div>
      </div>
    );
  }

  // Calculate center point
  const centerLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
  const centerLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

  // Custom icons for pickup and delivery
  const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Heading */}
      <div className="bg-card border-b border-border px-6 py-3 flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Route Map</h3>
      </div>

      {/* Map Container */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] px-4 py-2 bg-blue-500 text-white text-sm rounded-lg shadow-lg">
            Loading route...
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] px-4 py-2 bg-orange-500 text-white text-xs rounded-lg shadow-lg">
            {error}
          </div>
        )}
        <MapContainer
        center={[centerLat, centerLng]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds locations={locations} route={route} />
        {route && (
          <Polyline
            positions={route}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.7,
            }}
          />
        )}
        {locations.map((location, index) => (
          <Marker 
            key={index} 
            position={[location.lat, location.lng]}
            icon={location.type === 'PICKUP' ? pickupIcon : deliveryIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">
                  Stop #{location.sequence}: {location.type}
                </p>
                <p className="text-gray-700 font-medium mt-1">{location.name}</p>
                {location.address && (
                  <div className="text-gray-600 mt-1">
                    {location.address.street && <p>{location.address.street}</p>}
                    <p>
                      {location.address.city}, {location.address.state} {location.address.zip_code}
                    </p>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        </MapContainer>
      </div>
    </div>
  );
}

