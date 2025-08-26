import { db } from '../db';
import { exitDetailsTable, investmentsTable } from '../db/schema';
import { type CreateExitDetailsInput, type ExitDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const createExitDetails = async (input: CreateExitDetailsInput): Promise<ExitDetails> => {
  try {
    // First validate that the investment exists
    const existingInvestments = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, input.investment_id))
      .execute();

    if (existingInvestments.length === 0) {
      throw new Error(`Investment with id ${input.investment_id} not found`);
    }

    // Insert exit details record
    const result = await db.insert(exitDetailsTable)
      .values({
        investment_id: input.investment_id,
        exit_date: input.exit_date,
        proceeds_received: input.proceeds_received.toString(), // Convert number to string for numeric column
        exit_multiple: input.exit_multiple, // Real column - no conversion needed
        notes: input.notes
      })
      .returning()
      .execute();

    const exitDetails = result[0];

    // Update investment status to "Exited" if not already set
    const investment = existingInvestments[0];
    if (investment.status !== 'Exited') {
      await db.update(investmentsTable)
        .set({ 
          status: 'Exited',
          updated_at: new Date()
        })
        .where(eq(investmentsTable.id, input.investment_id))
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...exitDetails,
      proceeds_received: parseFloat(exitDetails.proceeds_received) // Convert string back to number
    };
  } catch (error) {
    console.error('Exit details creation failed:', error);
    throw error;
  }
};