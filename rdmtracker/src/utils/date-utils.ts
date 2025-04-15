// src/utils/date-utils.ts
import { date } from 'quasar'

/**
 * Utility service for consistent date handling across the application
 */
export const dateUtils = {
  /**
   * Format a date to ISO format (YYYY-MM-DD) for API interactions and form inputs
   * @param dateValue Date value as string or Date object
   * @returns Formatted date string in YYYY-MM-DD format
   */
  toISODate(dateValue: string | Date | null | undefined): string {
    if (!dateValue) {
      return ''
    }

    const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue

    // Handle invalid dates
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided:', dateValue)
      return ''
    }

    return dateObj.toISOString().substring(0, 10)
  },

  /**
   * Format a date for display in the UI
   * @param dateValue Date value as string or Date object
   * @param format Optional format string (defaults to 'MMM D, YYYY')
   * @returns Formatted date string for display
   */
  formatDisplay(
    dateValue: string | Date | null | undefined,
    format = 'MMM D, YYYY'
  ): string {
    if (!dateValue) {
      return ''
    }

    const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue

    // Handle invalid dates
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided:', dateValue)
      return 'Invalid date'
    }

    return date.formatDate(dateObj, format)
  },

  /**
   * Format a time for display
   * @param dateValue Date value as string or Date object
   * @returns Formatted time string (e.g., "10:30 AM")
   */
  formatTime(dateValue: string | Date | null | undefined): string {
    if (!dateValue) {
      return ''
    }

    const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue

    // Handle invalid dates
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided:', dateValue)
      return ''
    }

    return date.formatDate(dateObj, 'h:mm A')
  },

  /**
   * Get the current date in ISO format
   * @returns Current date in YYYY-MM-DD format
   */
  getCurrentDate(): string {
    return new Date().toISOString().substring(0, 10)
  },

  /**
   * Group expenses by date
   * @param expenses Array of expenses
   * @returns Object with dates as keys and arrays of expenses as values
   */
  groupByDate<T extends { date: string | Date }>(items: T[]): Record<string, T[]> {
    return items.reduce((groups, item) => {
      const itemDate = this.toISODate(item.date)

      if (!groups[itemDate]) {
        groups[itemDate] = []
      }

      groups[itemDate].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  /**
   * Check if a date is today
   * @param dateValue Date to check
   * @returns True if the date is today
   */
  isToday(dateValue: string | Date): boolean {
    const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
    const today = new Date()

    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    )
  }
}
