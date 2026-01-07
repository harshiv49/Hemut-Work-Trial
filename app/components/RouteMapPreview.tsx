'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface Location {
  name: string;
  lat: number;
  lng: number;
  type: 'PICKUP' | 'DELIVERY';
}

interface RouteMapPreviewProps {
  locations: Location[];
  className?: string;
}

// Component to fit map bounds to show all locations
function MapBounds({ locations, route }: { locations: Location[]; route: [number, number][] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length === 0) return;
    
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route as [number, number][]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.lat, loc.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, locations, route]);

  return null;
}

export default function RouteMapPreview({ locations, className = '' }: RouteMapPreviewProps) {
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locations.length < 2) {
      setRoute(null);
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      
      try {
        // Build OSRM API URL with all locations
        const coordinates = locations
          .map(loc => `${loc.lng},${loc.lat}`)
          .join(';');
        
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            (coord: number[]) => [coord[1], coord[0]] as [number, number]
          );
          setRoute(coordinates);
        } else {
          // Fallback to straight lines
          const straightLine = locations.map(loc => [loc.lat, loc.lng] as [number, number]);
          setRoute(straightLine);
        }
      } catch (err) {
        console.error('Error fetching route:', err);
        // Fallback to straight lines
        const straightLine = locations.map(loc => [loc.lat, loc.lng] as [number, number]);
        setRoute(straightLine);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [locations]);

  if (locations.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500 text-sm">Add stops to see route on map</p>
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
    <div className={`relative rounded-lg overflow-hidden border border-gray-300 ${className}`}>
      {loading && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-[1000] px-3 py-1 bg-blue-500 text-white text-xs rounded shadow-lg">
          Loading route...
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
                <p className="font-semibold">{location.type}</p>
                <p>{location.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

