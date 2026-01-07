'use client';

import { useState, useEffect } from 'react';

interface City {
  name: string;
  state: string;
  stateCode: string;
}

// Major US cities by state for autocomplete
const US_CITIES: City[] = [
  // Alabama
  { name: 'Birmingham', state: 'Alabama', stateCode: 'AL' },
  { name: 'Montgomery', state: 'Alabama', stateCode: 'AL' },
  // Alaska
  { name: 'Anchorage', state: 'Alaska', stateCode: 'AK' },
  // Arizona
  { name: 'Phoenix', state: 'Arizona', stateCode: 'AZ' },
  { name: 'Tucson', state: 'Arizona', stateCode: 'AZ' },
  // California
  { name: 'Los Angeles', state: 'California', stateCode: 'CA' },
  { name: 'San Francisco', state: 'California', stateCode: 'CA' },
  { name: 'San Diego', state: 'California', stateCode: 'CA' },
  { name: 'Sacramento', state: 'California', stateCode: 'CA' },
  // Colorado
  { name: 'Denver', state: 'Colorado', stateCode: 'CO' },
  // Connecticut
  { name: 'Hartford', state: 'Connecticut', stateCode: 'CT' },
  // Florida
  { name: 'Miami', state: 'Florida', stateCode: 'FL' },
  { name: 'Orlando', state: 'Florida', stateCode: 'FL' },
  { name: 'Tampa', state: 'Florida', stateCode: 'FL' },
  // Georgia
  { name: 'Atlanta', state: 'Georgia', stateCode: 'GA' },
  // Illinois
  { name: 'Chicago', state: 'Illinois', stateCode: 'IL' },
  { name: 'Hartford', state: 'Illinois', stateCode: 'IL' },
  // Indiana
  { name: 'Indianapolis', state: 'Indiana', stateCode: 'IN' },
  // Massachusetts
  { name: 'Boston', state: 'Massachusetts', stateCode: 'MA' },
  // Michigan
  { name: 'Detroit', state: 'Michigan', stateCode: 'MI' },
  // Minnesota
  { name: 'Minneapolis', state: 'Minnesota', stateCode: 'MN' },
  // Missouri
  { name: 'Kansas City', state: 'Missouri', stateCode: 'MO' },
  { name: 'St. Louis', state: 'Missouri', stateCode: 'MO' },
  // Nevada
  { name: 'Las Vegas', state: 'Nevada', stateCode: 'NV' },
  // New York
  { name: 'New York', state: 'New York', stateCode: 'NY' },
  { name: 'Buffalo', state: 'New York', stateCode: 'NY' },
  // Ohio
  { name: 'Columbus', state: 'Ohio', stateCode: 'OH' },
  { name: 'Cleveland', state: 'Ohio', stateCode: 'OH' },
  // Pennsylvania
  { name: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA' },
  { name: 'Pittsburgh', state: 'Pennsylvania', stateCode: 'PA' },
  // Texas
  { name: 'Houston', state: 'Texas', stateCode: 'TX' },
  { name: 'Dallas', state: 'Texas', stateCode: 'TX' },
  { name: 'Austin', state: 'Texas', stateCode: 'TX' },
  { name: 'San Antonio', state: 'Texas', stateCode: 'TX' },
  { name: 'Irving', state: 'Texas', stateCode: 'TX' },
  // Washington
  { name: 'Seattle', state: 'Washington', stateCode: 'WA' },
];

interface CityPickerProps {
  label?: string;
  placeholder?: string;
  value?: string; // Format: "City, ST"
  onChange: (city: string, state: string, stateCode: string) => void;
  required?: boolean;
}

export default function CityPicker({
  label = 'City',
  placeholder = 'Search for a city...',
  value,
  onChange,
  required = false,
}: CityPickerProps) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const filtered = US_CITIES.filter(
        (city) =>
          city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.stateCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCities([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setSearchTerm(`${city.name}, ${city.stateCode}`);
    setShowDropdown(false);
    onChange(city.name, city.state, city.stateCode);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setSelectedCity(null);
        }}
        onFocus={() => {
          if (filteredCities.length > 0) {
            setShowDropdown(true);
          }
        }}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[#F4B223] focus:border-transparent text-foreground placeholder:text-muted-foreground"
        required={required}
      />
      
      {showDropdown && filteredCities.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto border border-border rounded-lg bg-card shadow-xl">
          {filteredCities.map((city, index) => (
            <button
              key={`${city.name}-${city.stateCode}-${index}`}
              type="button"
              onClick={() => handleSelectCity(city)}
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b border-border last:border-b-0 transition-colors"
            >
              <div className="font-medium text-foreground">
                {city.name}, {city.stateCode}
              </div>
              <div className="text-xs text-muted-foreground">{city.state}</div>
            </button>
          ))}
        </div>
      )}

      {searchTerm.length > 0 && searchTerm.length < 2 && !selectedCity && (
        <p className="text-xs text-muted-foreground mt-1">
          Type at least 2 characters to search
        </p>
      )}
    </div>
  );
}

