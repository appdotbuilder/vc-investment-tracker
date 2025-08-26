import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetInvestmentByIdInput, type Investment } from '../schema';

export const getInvestmentById = async (input: GetInvestmentByIdInput): Promise<Investment | null> => {
  try {
    // Query for the investment by ID
    const result = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, input.id))
      .execute();

    // Return null if no investment found
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields from strings to numbers before returning
    const investment = result[0];
    return {
      ...investment,
      amount_invested: parseFloat(investment.amount_invested), // Convert numeric to number
      current_valuation: investment.current_valuation ? parseFloat(investment.current_valuation) : null // Handle nullable numeric
    };
  } catch (error) {
    console.error('Investment retrieval failed:', error);
    throw error;
  }
};