import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import axios from 'axios';

const AddressAutocomplete = ({ value, onChange, placeholder = "Enter your location", className = "" }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchText) => {
    if (searchText.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim API (OpenStreetMap)
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: searchText,
          format: 'json',
          addressdetails: 1,
          limit: 5,
        },
        headers: {
          'Accept-Language': 'en-US,en;q=0.5',
          'User-Agent': 'Hyperlocal-Marketplace-App' // Required by Nominatim Policy
        }
      });
      setSuggestions(response.data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    
    // Clear existing timer
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Set new timer (Debounce 500ms)
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 500);

    // Also update parent state if they want manual typing support
    if (onChange) {
      onChange({ address: text, coordinates: null });
    }
  };

  const handleSelect = (suggestion) => {
    const address = suggestion.display_name;
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);

    setQuery(address);
    setSuggestions([]);
    setShowDropdown(false);

    if (onChange) {
      onChange({ 
        address, 
        coordinates: [lat, lon] 
      });
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 3 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 pl-12 pr-12 py-3.5 rounded-xl outline-none focus:border-primary-500 transition-colors font-medium"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="text-primary-500 animate-spin" size={18} />
          ) : (
            <Search className="text-slate-300" size={18} />
          )}
        </div>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl premium-shadow overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors group"
            >
              <div className="flex gap-3">
                <MapPin className="text-slate-400 group-hover:text-primary-500 shrink-0 mt-0.5" size={16} />
                <span className="text-sm font-medium text-slate-700 break-words">{item.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
