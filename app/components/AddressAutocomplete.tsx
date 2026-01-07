'use client';

import { useState, useEffect, useRef } from 'react';
import { AddressFormData } from '../types/create-order';

interface AddressAutocompleteProps {
  stopIndex: number;
  address: AddressFormData;
  onAddressUpdate: (stopIndex: number, address: Partial<AddressFormData>) => void;
  required?: boolean;
}

interface AddressSuggestion {
  display: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
}

export default function AddressAutocomplete({
  stopIndex,
  address,
  onAddressUpdate,
  required = false,
}: AddressAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Build display string from current address
  const getDisplayAddress = () => {
    if (searchQuery) return searchQuery;
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zip_code,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  // Search for addresses using Nominatim (OpenStreetMap) API
  // This is free and doesn't require an API key
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Using Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `countrycodes=us&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5`,
        {
          headers: {
            'User-Agent': 'TMS-Application', // Required by Nominatim
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const parsedSuggestions: AddressSuggestion[] = data.map((item: any) => {
          const addr = item.address || {};
          
          return {
            display: item.display_name,
            street: addr.road || addr.street || '',
            city: addr.city || addr.town || addr.village || '',
            state: addr.state || '',
            zip: addr.postcode || '',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });

        setSuggestions(parsedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (searchQuery.trim()) {
        searchAddress(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    // Extract state abbreviation if we have a full state name
    const stateAbbr = getStateAbbreviation(suggestion.state);
    
    onAddressUpdate(stopIndex, {
      street: suggestion.street,
      city: suggestion.city,
      state: stateAbbr,
      zip_code: suggestion.zip,
      latitude: suggestion.lat,
      longitude: suggestion.lng,
    });

    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Helper to convert state name to abbreviation
  const getStateAbbreviation = (stateName: string): string => {
    const stateMap: { [key: string]: string } = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
    };

    return stateMap[stateName] || stateName;
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        🔍 Search Address (Optional) {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="Start typing an address..."
          value={searchQuery || getDisplayAddress()}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="w-full px-3 py-2 pl-9 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-blue-50"
        />
        <div className="absolute left-2 top-2">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto border-2 border-blue-300 rounded-lg bg-white shadow-xl">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="font-medium text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {suggestion.display}
              </div>
              {suggestion.street && (
                <div className="text-xs text-gray-500 ml-6">
                  {suggestion.street}, {suggestion.city}, {suggestion.state} {suggestion.zip}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      
      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <p className="text-xs text-blue-600 mt-1">Type at least 3 characters to search</p>
      )}
      
      {showSuggestions && suggestions.length === 0 && !isLoading && searchQuery.length >= 3 && (
        <div className="absolute z-20 mt-1 w-full border border-gray-200 rounded-lg bg-white shadow-lg p-3">
          <p className="text-sm text-gray-500">No addresses found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}

