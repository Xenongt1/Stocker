import React, { useState, useEffect } from 'react';

const SearchBar = ({
  placeholder = 'Search...',
  onSearch,
  initialValue = '',
  debounceTime = 300,
  className = '',
  filters = [],
  advancedSearch = false
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  
  // Initialize selected filters based on provided filters
  useEffect(() => {
    const initialFilters = {};
    filters.forEach(filter => {
      initialFilters[filter.id] = filter.defaultValue || '';
    });
    setSelectedFilters(initialFilters);
  }, [filters]);
  
  // Handle search term change with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      const searchData = advancedSearch ? { searchTerm, filters: selectedFilters } : searchTerm;
      onSearch(searchData);
    }, debounceTime);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, selectedFilters, onSearch, debounceTime, advancedSearch]);
  
  // Handle filter change
  const handleFilterChange = (filterId, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  };
  
  // Handle search input change
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Clear search and filters
  const handleClear = () => {
    setSearchTerm('');
    
    const resetFilters = {};
    filters.forEach(filter => {
      resetFilters[filter.id] = filter.defaultValue || '';
    });
    setSelectedFilters(resetFilters);
  };
  
  return (
    <div className={`search-bar ${className}`}>
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {searchTerm && (
            <button
              className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {advancedSearch && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowAdvanced(!showAdvanced)}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Advanced search filters */}
        {advancedSearch && showAdvanced && filters.length > 0 && (
          <div className="mt-2 p-3 bg-white border rounded-md shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filters.map(filter => (
                <div key={filter.id} className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">{filter.label}</label>
                  {filter.type === 'select' ? (
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedFilters[filter.id] || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    >
                      <option value="">{filter.placeholder || 'Select option'}</option>
                      {filter.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : filter.type === 'date' ? (
                    <input
                      type="date"
                      className="w-full p-2 border rounded-md"
                      value={selectedFilters[filter.id] || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    />
                  ) : filter.type === 'number' ? (
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      placeholder={filter.placeholder || ''}
                      value={selectedFilters[filter.id] || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder={filter.placeholder || ''}
                      value={selectedFilters[filter.id] || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-3 flex justify-end space-x-2">
              <button
                type="button"
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={handleClear}
              >
                Clear All
              </button>
              <button
                type="button"
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                onClick={() => {
                  onSearch({ searchTerm, filters: selectedFilters });
                  setShowAdvanced(false);
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;