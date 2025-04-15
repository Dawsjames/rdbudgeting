// src/models/expense.ts
export interface Audit {
  createdAt: Date;
  updatedAt: Date;
}

export interface RDExpense extends Audit {
  _id: string;
  amount: number;
  description: string;
  category: string;
  date: string | Date;
}

export interface ExpenseInput {
  amount: number;
  description: string;
  category: string;
  date: string | Date;
}

// This replaces the MongoDB model with a simple type definition
// No mongoose required anymore