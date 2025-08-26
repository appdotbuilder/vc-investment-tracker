import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { type Investment } from '../schema';
import { desc } from 'drizzle-orm';

export const getInvestments = async (): Promise<Investment[]> => {
  try {
    // Fetch all investments ordered by creation date (newest first)
    const results = await db.select()
      .from(investmentsTable)
      .orderBy(desc(investmentsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(investment => ({
      ...investment,
      amount_invested: parseFloat(investment.amount_invested), // Convert string to number
      current_valuation: investment.current_valuation ? parseFloat(investment.current_valuation) : null // Handle nullable numeric
    }));
  } catch (error) {
    console.error('Failed to fetch investments:', error);
    throw error;
  }
};