import { db } from '../db';
import { exitDetailsTable, investmentsTable } from '../db/schema';
import { type DeleteExitDetailsInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteExitDetails = async (input: DeleteExitDetailsInput): Promise<{ success: boolean }> => {
  try {
    // First, get the exit details to find the related investment
    const exitDetails = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.id, input.id))
      .execute();

    if (exitDetails.length === 0) {
      throw new Error(`Exit details with id ${input.id} not found`);
    }

    const investmentId = exitDetails[0].investment_id;

    // Delete the exit details record
    const deleteResult = await db.delete(exitDetailsTable)
      .where(eq(exitDetailsTable.id, input.id))
      .returning()
      .execute();

    if (deleteResult.length === 0) {
      throw new Error(`Failed to delete exit details with id ${input.id}`);
    }

    // Update the related investment status back to "Active" if it was "Exited"
    await db.update(investmentsTable)
      .set({ 
        status: 'Active',
        updated_at: new Date()
      })
      .where(eq(investmentsTable.id, investmentId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Exit details deletion failed:', error);
    throw error;
  }
};