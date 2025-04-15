// src/routes/expenses.ts
import { Elysia, t } from 'elysia';
import { v4 as uuidv4 } from 'uuid';
import type { RDExpense } from '../models/expense';
import db from '../db';

// Define the expense schema for validation
const expenseSchema = t.Object({
  amount: t.Number({ minimum: 0.01 }), // Ensure positive amounts
  description: t.String({ minLength: 1 }),
  category: t.String({ minLength: 1 }),
  date: t.String() // Required field
});

// Define error responses
const notFoundResponse = (message = 'Expense not found') => ({
  status: 404,
  body: { error: message }
});

const serverErrorResponse = (message = 'Internal server error') => ({
  status: 500,
  body: { error: message }
});

export const expenseRoutes = new Elysia({ prefix: '/api/expenses' })
  // Get all expenses
  .get('/', async ({ set }) => {
    try {
      console.log('GET /expenses - Reading database...');
      await db.read();
      
      if (!db.data) {
        console.log('Database not initialized, returning empty array');
        return [];
      }
      
      console.log(`Found ${db.data.expenses.length} expenses`);
      return db.data.expenses.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error in GET /expenses:', error);
      set.status = 500;
      return { error: `Failed to fetch expenses: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  })

  // Get expense by ID
  .get('/:id', async ({ params, set }) => {
    try {
      await db.read();
      
      if (!db.data) {
        set.status = 500;
        return { error: 'Database not initialized' };
      }
      
      const expense = db.data.expenses.find(e => e._id === params.id);
      
      if (!expense) {
        set.status = 404;
        return { error: 'Expense not found' };
      }
      
      return expense;
    } catch (error) {
      console.error('Error in GET /expenses/:id:', error);
      set.status = 500;
      return { error: 'Failed to fetch expense' };
    }
  })

  // Add expense
  .post('/', async ({ body, set }) => {
    try {
      await db.read();
      
      if (!db.data) {
        set.status = 500;
        return { error: 'Database not initialized' };
      }
      
      const newExpense: RDExpense = {
        _id: uuidv4(),
        ...body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      db.data.expenses.push(newExpense);
      await db.write();
      
      set.status = 201; // Created
      return newExpense;
    } catch (error) {
      console.error('Error in POST /expenses:', error);
      set.status = 500;
      return { error: 'Failed to create expense' };
    }
  }, {
    body: expenseSchema
  })

  // Update expense
  .put('/:id', async ({ params, body, set }) => {
    try {
      await db.read();
      
      if (!db.data) {
        set.status = 500;
        return { error: 'Database not initialized' };
      }
      
      const index = db.data.expenses.findIndex(e => e._id === params.id);
      if (index === -1) {
        set.status = 404;
        return { error: 'Expense not found' };
      }
      
      const updatedExpense: RDExpense = {
        ...db.data.expenses[index],
        ...body,
        updatedAt: new Date()
      };
      
      db.data.expenses[index] = updatedExpense;
      await db.write();
      
      return updatedExpense;
    } catch (error) {
      console.error('Error in PUT /expenses/:id:', error);
      set.status = 500;
      return { error: 'Failed to update expense' };
    }
  }, {
    body: expenseSchema
  })

  // Delete expense
  .delete('/:id', async ({ params, set }) => {
    try {
      await db.read();
      
      if (!db.data) {
        set.status = 500;
        return { error: 'Database not initialized' };
      }
      
      const index = db.data.expenses.findIndex(e => e._id === params.id);
      if (index === -1) {
        set.status = 404;
        return { error: 'Expense not found' };
      }
      
      db.data.expenses.splice(index, 1);
      await db.write();
      
      return { message: 'Expense deleted successfully' };
    } catch (error) {
      console.error('Error in DELETE /expenses/:id:', error);
      set.status = 500;
      return { error: 'Failed to delete expense' };
    }
  });