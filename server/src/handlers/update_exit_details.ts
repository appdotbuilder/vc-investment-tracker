import { db } from '../db';
import { exitDetailsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateExitDetailsInput, type ExitDetails } from '../schema';

export const updateExitDetails = async (input: UpdateExitDetailsInput): Promise<ExitDetails> => {
  try {
    // First, check if the exit details record exists
    const existingRecord = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.id, input.id))
      .execute();

    if (existingRecord.length === 0) {
      throw new Error(`Exit details with ID ${input.id} not found`);
    }

    // Prepare update data, only including fields that are provided
    const updateData: any = {};
    
    if (input.exit_date !== undefined) {
      updateData.exit_date = input.exit_date;
    }
    if (input.proceeds_received !== undefined) {
      updateData.proceeds_received = input.proceeds_received.toString(); // Convert to string for numeric column
    }
    if (input.exit_multiple !== undefined) {
      updateData.exit_multiple = input.exit_multiple;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the exit details record
    const result = await db.update(exitDetailsTable)
      .set(updateData)
      .where(eq(exitDetailsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const exitDetails = result[0];
    return {
      ...exitDetails,
      proceeds_received: parseFloat(exitDetails.proceeds_received) // Convert string back to number
    };
  } catch (error) {
    console.error('Exit details update failed:', error);
    throw error;
  }
};