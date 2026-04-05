import { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

const DEFAULT_FILTERS = { genres: [], platforms: [], tags: [], ordering: 'combined' };

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
    setSearchInput('');
  };

  return (
    <FilterContext.Provider value={{ 
      filters, setFilters, 
      search, setSearch, 
      searchInput, setSearchInput, 
      clearAll 
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => useContext(FilterContext);