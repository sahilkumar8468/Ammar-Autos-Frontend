/**
 * searchUtils.js — Helper for frontend search filtering
 */

/**
 * Filters an array of objects based on a search query and a list of fields.
 * Returns only the exact or partial matches for the given particular result.
 * 
 * @param {Array} data - The array of objects to filter.
 * @param {string} query - The search query string.
 * @param {Array<string>} fields - The keys in the objects to search against.
 * @returns {Array} - The filtered array.
 */
export function filterData(data, query, fields) {
  if (!query || !query.trim()) return data;
  
  const lowerQuery = query.toLowerCase().trim();
  
  return data.filter(item => {
    return fields.some(field => {
      const val = item[field];
      if (val == null) return false;
      return String(val).toLowerCase().includes(lowerQuery);
    });
  });
}
