/**
 * API utility functions for handling mock responses and common patterns
 */

/**
 * Create a mock API response with delay
 * @param data - Response data
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Promise with mock response
 */
export const createMockResponse = <T>(data: T, delay: number = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

/**
 * Create a mock error response
 * @param message - Error message
 * @param code - Error code (default: 400)
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Promise that rejects with error
 */
export const createMockError = (
  message: string, 
  code: number = 400, 
  delay: number = 500
): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${code}: ${message}`));
    }, delay);
  });
};

/**
 * Generate a mock ID with timestamp
 * @param prefix - ID prefix (default: 'mock')
 * @returns Generated ID string
 */
export const generateMockId = (prefix: string = 'mock'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a mock success message response
 * @param message - Success message
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Promise with message response
 */
export const createMockMessageResponse = (
  message: string, 
  delay: number = 500
): Promise<{ message: string }> => {
  return createMockResponse({ message }, delay);
};

/**
 * Simulate API loading state
 * @param minDelay - Minimum delay in milliseconds (default: 300)
 * @param maxDelay - Maximum delay in milliseconds (default: 1000)
 * @returns Promise that resolves after random delay
 */
export const simulateLoading = (
  minDelay: number = 300, 
  maxDelay: number = 1000
): Promise<void> => {
  const delay = Math.random() * (maxDelay - minDelay) + minDelay;
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

/**
 * Mock pagination helper
 * @param items - Array of items to paginate
 * @param page - Page number (1-based)
 * @param limit - Items per page
 * @returns Paginated result
 */
export const mockPaginate = <T>(
  items: T[], 
  page: number = 1, 
  limit: number = 10
) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    data: paginatedItems,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(items.length / limit),
      totalItems: items.length,
      itemsPerPage: limit,
      hasNext: endIndex < items.length,
      hasPrev: page > 1,
    },
  };
};