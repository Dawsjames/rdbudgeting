// src/db.ts
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import type { RDExpense } from './models/expense';

// Define the database structure
interface Database {
  expenses: RDExpense[];
}

// Get current directory even when using ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configure lowdb to write to db.json
const file = join(__dirname, '../db.json');
const adapter = new JSONFile<Database>(file);

// Create lowdb instance with default data
const defaultData: Database = { expenses: [] };
const db = new Low<Database>(adapter, defaultData);

// Initialize database
export const initDb = async (): Promise<void> => {
  try {
    console.log('Reading database...');
    await db.read();
    
    // If db.data is null after reading, set it to default data
    if (db.data === null) {
      console.log('Data is null, initializing with defaults');
      db.data = defaultData;
    }
    
    // Add some sample data if the database is empty
    if (db.data.expenses.length === 0) {
      console.log('Adding sample data');
      db.data.expenses = [
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
        }
      ];
    }
    
    await db.write();
    console.log('Database initialized with', db.data.expenses.length, 'expenses');
  } catch (error) {
    console.error('Database initialization error:', error);
    // Try to recover by creating a new database file
    db.data = defaultData;
    try {
      await db.write();
      console.log('Created new database file');
    } catch (writeError) {
      console.error('Fatal: Cannot write to database file', writeError);
      throw writeError;
    }
  }
};

// Initialize the database
initDb().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1); // Exit if database cannot be initialized
});

export default db;