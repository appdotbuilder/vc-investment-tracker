import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInvestmentInput } from '../schema';

export const deleteInvestment = async (input: DeleteInvestmentInput): Promise<{ success: boolean }> => {
  try {
    // Delete the investment record
    // The schema has cascade delete configured, so exit details will be automatically removed
    const result = await db.delete(investmentsTable)
      .where(eq(investmentsTable.id, input.id))
      .execute();

    // Check if any rows were affected (investment existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Investment deletion failed:', error);
    throw error;
  }
};