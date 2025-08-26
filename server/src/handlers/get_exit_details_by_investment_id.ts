import { db } from '../db';
import { exitDetailsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetExitDetailsByInvestmentIdInput, type ExitDetails } from '../schema';

export const getExitDetailsByInvestmentId = async (input: GetExitDetailsByInvestmentIdInput): Promise<ExitDetails | null> => {
  try {
    // Query exit details by investment_id
    const results = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.investment_id, input.investment_id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const exitDetails = results[0];
    return {
      ...exitDetails,
      proceeds_received: parseFloat(exitDetails.proceeds_received),
      investment_id: exitDetails.investment_id,
      exit_multiple: exitDetails.exit_multiple // Real column is already a number
    };
  } catch (error) {
    console.error('Failed to fetch exit details by investment ID:', error);
    throw error;
  }
};