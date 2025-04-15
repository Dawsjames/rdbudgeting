// src/services/expenses.ts
import api from './api'
import { Notify } from 'quasar'

export interface Audit {
  createdAt: Date;
  updatedAt: Date;
}

// Main expense interface that includes audit fields
export interface RDExpense {
  _id?: string;
  amount: number;
  description: string;
  category: string;
  date: string; // Consistently use string format for dates across the app
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for expense form/creation - without audit fields
export interface ExpenseForm {
  amount: number;
  description: string;
  category: string;
  date: string;
}

// Safer notification handling function that doesn't rely directly on Notify
const showNotification = (type: 'positive' | 'negative', message: string, icon = '') => {
  try {
    // Check if Notify is available
    if (typeof Notify?.create === 'function') {
      Notify.create({
        color: type,
        message: message,
        icon: icon || (type === 'positive' ? 'check' : 'error')
      });
    } else {
      // Fallback to console
      console.log(`[${type.toUpperCase()}] ${message}`);

      // Try to use alert for critical errors in development
      if (type === 'negative' && process.env.NODE_ENV === 'development') {
        alert(message);
      }
    }
  } catch (error) {
    console.error('Failed to show notification:', error);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

// Standard error handling to ensure consistent user feedback
const handleApiError = (error: unknown, fallbackMessage: string): never => {
  console.error(fallbackMessage, error);

  let errorMessage = fallbackMessage;
  if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  }

  showNotification('negative', errorMessage);
  throw new Error(errorMessage);
}

export const expenseService = {
  getAll: async (): Promise<RDExpense[]> => {
    try {
      const response = await api.get<RDExpense[]>('/api/expenses');

      // Handle empty response or no data property
      if (!response || !response.data) {
        return [];
      }

      return response.data;
    } catch (error) {
      // For development/testing, return mock data instead of failing completely
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock data due to API failure', error);
        return getMockExpenses();
      }
      return handleApiError(error, 'Failed to load expenses');
    }
  },

  getById: async (id: string): Promise<RDExpense> => {
    try {
      const response = await api.get<RDExpense>(`/api/expenses/${id}`);
      return response.data;
    } catch (error) {
      // For development, find in mock data
      if (process.env.NODE_ENV === 'development') {
        const mockExpense = getMockExpenses().find(e => e._id === id);
        if (mockExpense) return mockExpense;
      }
      return handleApiError(error, `Failed to load expense with ID: ${id}`);
    }
  },

  create: async (expense: ExpenseForm): Promise<RDExpense> => {
    try {
      const response = await api.post<RDExpense>('/api/expenses', expense);

      showNotification('positive', 'Expense added successfully', 'check');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'Failed to create expense');
    }
  },

  update: async (id: string, expense: ExpenseForm): Promise<RDExpense> => {
    try {
      const response = await api.put<RDExpense>(`/api/expenses/${id}`, expense);

      showNotification('positive', 'Expense updated successfully', 'check');
      return response.data;
    } catch (error) {
      return handleApiError(error, `Failed to update expense with ID: ${id}`);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/expenses/${id}`);
      showNotification('positive', 'Expense deleted successfully', 'check');
    } catch (error) {
      handleApiError(error, `Failed to delete expense with ID: ${id}`);
    }
  },

  // Utility function to standardize date handling
  formatDate: (dateString: string | Date): string => {
    if (!dateString) return '';

    // Convert to date object and then to ISO string
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Get YYYY-MM-DD format
    return date.toISOString().substring(0, 10);
  },

  // Format display date
  formatDisplayDate: (dateString: string | Date): string => {
    if (!dateString) return '';

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Format as locale date string
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// Mock data for development/testing when API is unavailable
function getMockExpenses(): RDExpense[] {
  return [
    {
      _id: '1',
      description: "Grocery Shopping",
      amount: 87.45,
      category: "Food",
      date: "2025-04-10",
      createdAt: new Date("2025-04-10"),
      updatedAt: new Date("2025-04-10")
    },
    {
      _id: '2',
      description: "Monthly Rent",
      amount: 1200,
      category: "Housing",
      date: "2025-04-01",
      createdAt: new Date("2025-04-01"),
      updatedAt: new Date("2025-04-01")
    },
    {
      _id: '3',
      description: "Netflix Subscription",
      amount: 15.99,
      category: "Entertainment",
      date: "2025-04-05",
      createdAt: new Date("2025-04-05"),
      updatedAt: new Date("2025-04-05")
    },
    {
      _id: '4',
      description: "Gas Station",
      amount: 45.30,
      category: "Transportation",
      date: "2025-04-12",
      createdAt: new Date("2025-04-12"),
      updatedAt: new Date("2025-04-12")
    }
  ];
}
