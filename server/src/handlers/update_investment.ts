import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { type UpdateInvestmentInput, type Investment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInvestment = async (input: UpdateInvestmentInput): Promise<Investment> => {
  try {
    // First, check if the investment exists
    const existingInvestment = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, input.id))
      .execute();

    if (existingInvestment.length === 0) {
      throw new Error(`Investment with id ${input.id} not found`);
    }

    // Prepare update values - only include defined fields
    const updateValues: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.company_name !== undefined) {
      updateValues.company_name = input.company_name;
    }
    if (input.investment_date !== undefined) {
      updateValues.investment_date = input.investment_date;
    }
    if (input.amount_invested !== undefined) {
      updateValues.amount_invested = input.amount_invested.toString(); // Convert to string for numeric column
    }
    if (input.funding_round !== undefined) {
      updateValues.funding_round = input.funding_round;
    }
    if (input.equity_percentage !== undefined) {
      updateValues.equity_percentage = input.equity_percentage;
    }
    if (input.current_valuation !== undefined) {
      updateValues.current_valuation = input.current_valuation?.toString() || null; // Convert to string for numeric column
    }
    if (input.status !== undefined) {
      updateValues.status = input.status;
    }
    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    // Update the investment record
    const result = await db.update(investmentsTable)
      .set(updateValues)
      .where(eq(investmentsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const investment = result[0];
    return {
      ...investment,
      amount_invested: parseFloat(investment.amount_invested),
      current_valuation: investment.current_valuation ? parseFloat(investment.current_valuation) : null
    };
  } catch (error) {
    console.error('Investment update failed:', error);
    throw error;
  }
};