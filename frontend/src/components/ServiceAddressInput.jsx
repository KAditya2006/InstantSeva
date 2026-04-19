import React, { useState } from 'react';
import AddressAutocomplete from './AddressAutocomplete';
import { toStoredCoordinates } from '../utils/location';

const ServiceAddressInput = ({ value, onChange }) => {
  const [mode, setMode] = useState('search');

  const switchMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'manual') {
      onChange({ address: value || '', coordinates: null });
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1 border border-slate-100">
        <button
          type="button"
          onClick={() => switchMode('search')}
          className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${mode === 'search' ? 'bg-white text-primary-700 premium-shadow' : 'text-slate-500'}`}
        >
          Search on map
        </button>
        <button
          type="button"
          onClick={() => switchMode('manual')}
          className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${mode === 'manual' ? 'bg-white text-primary-700 premium-shadow' : 'text-slate-500'}`}
        >
          Enter manually
        </button>
      </div>

      {mode === 'search' ? (
        <AddressAutocomplete
          required
          value={value}
          onChange={({ address, coordinates }) => onChange({
            address,
            coordinates: coordinates ? toStoredCoordinates(coordinates) : null
          })}
          placeholder="Search service address"
          className="w-full"
        />
      ) : (
        <textarea
          required
          value={value}
          onChange={(event) => onChange({ address: event.target.value, coordinates: null })}
          placeholder="House number, street, landmark, area, city"
          className="w-full h-28 bg-slate-50 rounded-2xl px-4 py-4 outline-none border border-slate-100 focus:border-primary-500"
        />
      )}

      <p className="text-xs font-medium text-slate-400">
        Map search gives exact directions. Manual address is allowed, but worker will open it as a Google Maps search.
      </p>
    </div>
  );
};

export default ServiceAddressInput;
