/**
 * Utility functions for time formatting
 */

/**
 * Format seconds to HH:MM:SS format
 * @param seconds - Number of seconds
 * @returns Formatted time string (HH:MM:SS)
 */
export const formatSecondsToTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds to human readable format (Xh Ym Zs)
 * @param seconds - Number of seconds
 * @returns Formatted time string (Xh Ym Zs)
 */
export const formatSecondsToHumanReadable = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
};

/**
 * Format Date to Vietnamese locale string
 * @param date - Date object
 * @returns Formatted date string in Vietnamese format
 */
export const formatDateToVietnamese = (date: Date): string => {
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format Date to time only (HH:MM)
 * @param date - Date object
 * @returns Formatted time string (HH:MM)
 */
export const formatDateToTime = (date: Date): string => {
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};