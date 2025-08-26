import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { type CreateInvestmentInput, type Investment } from '../schema';

export const createInvestment = async (input: CreateInvestmentInput): Promise<Investment> => {
  try {
    // Insert investment record
    const result = await db.insert(investmentsTable)
      .values({
        company_name: input.company_name,
        investment_date: input.investment_date,
        amount_invested: input.amount_invested.toString(), // Convert number to string for numeric column
        funding_round: input.funding_round,
        equity_percentage: input.equity_percentage,
        current_valuation: input.current_valuation ? input.current_valuation.toString() : null, // Handle nullable numeric
        status: input.status,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const investment = result[0];
    return {
      ...investment,
      amount_invested: parseFloat(investment.amount_invested), // Convert string back to number
      current_valuation: investment.current_valuation ? parseFloat(investment.current_valuation) : null // Handle nullable numeric
    };
  } catch (error) {
    console.error('Investment creation failed:', error);
    throw error;
  }
};