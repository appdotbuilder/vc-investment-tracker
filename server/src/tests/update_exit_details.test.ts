import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investmentsTable, exitDetailsTable } from '../db/schema';
import { type UpdateExitDetailsInput, type CreateInvestmentInput, type CreateExitDetailsInput } from '../schema';
import { updateExitDetails } from '../handlers/update_exit_details';
import { eq } from 'drizzle-orm';

describe('updateExitDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testInvestmentId: number;
  let testExitDetailsId: number;

  // Helper to create test investment
  const createTestInvestment = async (): Promise<number> => {
    const testInvestment: CreateInvestmentInput = {
      company_name: 'Test Company',
      investment_date: new Date('2023-01-01'),
      amount_invested: 100000,
      funding_round: 'Seed',
      equity_percentage: 10,
      current_valuation: 1000000,
      status: 'Active',
      notes: 'Test investment'
    };

    const result = await db.insert(investmentsTable)
      .values({
        ...testInvestment,
        amount_invested: testInvestment.amount_invested.toString(),
        current_valuation: testInvestment.current_valuation?.toString() || null
      })
      .returning()
      .execute();

    return result[0].id;
  };

  // Helper to create test exit details
  const createTestExitDetails = async (investmentId: number): Promise<number> => {
    const testExitDetails: CreateExitDetailsInput = {
      investment_id: investmentId,
      exit_date: new Date('2023-12-01'),
      proceeds_received: 500000,
      exit_multiple: 5.0,
      notes: 'Test exit'
    };

    const result = await db.insert(exitDetailsTable)
      .values({
        ...testExitDetails,
        proceeds_received: testExitDetails.proceeds_received.toString()
      })
      .returning()
      .execute();

    return result[0].id;
  };

  beforeEach(async () => {
    testInvestmentId = await createTestInvestment();
    testExitDetailsId = await createTestExitDetails(testInvestmentId);
  });

  it('should update exit details successfully', async () => {
    const updateInput: UpdateExitDetailsInput = {
      id: testExitDetailsId,
      exit_date: new Date('2024-01-15'),
      proceeds_received: 750000,
      exit_multiple: 7.5,
      notes: 'Updated exit details'
    };

    const result = await updateExitDetails(updateInput);

    // Verify returned data
    expect(result.id).toEqual(testExitDetailsId);
    expect(result.investment_id).toEqual(testInvestmentId);
    expect(result.exit_date).toBeInstanceOf(Date);
    expect((result.exit_date as Date).getTime()).toEqual(updateInput.exit_date!.getTime());
    expect(result.proceeds_received).toEqual(750000);
    expect(typeof result.proceeds_received).toBe('number');
    expect(result.exit_multiple).toEqual(7.5);
    expect(result.notes).toEqual('Updated exit details');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated exit details to database', async () => {
    const updateInput: UpdateExitDetailsInput = {
      id: testExitDetailsId,
      proceeds_received: 600000,
      exit_multiple: 6.0
    };

    await updateExitDetails(updateInput);

    // Query database to verify update
    const exitDetails = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.id, testExitDetailsId))
      .execute();

    expect(exitDetails).toHaveLength(1);
    expect(parseFloat(exitDetails[0].proceeds_received)).toEqual(600000);
    expect(exitDetails[0].exit_multiple).toEqual(6.0);
    // Original values should remain unchanged
    expect(exitDetails[0].exit_date).toBeInstanceOf(Date);
    const dbExitDate = exitDetails[0].exit_date as Date;
    expect(dbExitDate.getTime()).toEqual(new Date('2023-12-01').getTime());
    expect(exitDetails[0].notes).toEqual('Test exit');
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateExitDetailsInput = {
      id: testExitDetailsId,
      notes: 'Only updating notes'
    };

    const result = await updateExitDetails(updateInput);

    // Verify only notes was updated
    expect(result.notes).toEqual('Only updating notes');
    expect(result.proceeds_received).toEqual(500000); // Original value
    expect(result.exit_multiple).toEqual(5.0); // Original value
    expect(result.exit_date).toBeInstanceOf(Date);
    // Type assertion to handle potential undefined (though we know it exists from previous test)
    const exitDate = result.exit_date as Date;
    expect(exitDate.getTime()).toEqual(new Date('2023-12-01').getTime()); // Original value
  });

  it('should handle null values correctly', async () => {
    const updateInput: UpdateExitDetailsInput = {
      id: testExitDetailsId,
      notes: null
    };

    const result = await updateExitDetails(updateInput);

    expect(result.notes).toBeNull();
  });

  it('should throw error when exit details not found', async () => {
    const updateInput: UpdateExitDetailsInput = {
      id: 99999, // Non-existent ID
      proceeds_received: 100000
    };

    await expect(updateExitDetails(updateInput)).rejects.toThrow(/Exit details with ID 99999 not found/i);
  });

  it('should handle numeric conversion properly', async () => {
    const updateInput: UpdateExitDetailsInput = {
      id: testExitDetailsId,
      proceeds_received: 1234567.89
    };

    const result = await updateExitDetails(updateInput);

    // Verify numeric precision is maintained
    expect(result.proceeds_received).toEqual(1234567.89);
    expect(typeof result.proceeds_received).toBe('number');

    // Verify in database
    const exitDetails = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.id, testExitDetailsId))
      .execute();

    expect(parseFloat(exitDetails[0].proceeds_received)).toEqual(1234567.89);
  });

  it('should update date fields correctly', async () => {
    const newExitDate = new Date('2024-06-15');
    const updateInput: UpdateExitDetailsInput = {
      id: testExitDetailsId,
      exit_date: newExitDate
    };

    const result = await updateExitDetails(updateInput);

    expect(result.exit_date).toBeInstanceOf(Date);
    expect((result.exit_date as Date).getTime()).toEqual(newExitDate.getTime());
    expect(result.exit_date).toBeInstanceOf(Date);
  });

  it('should handle multiple field updates', async () => {
    const updateInput: UpdateExitDetailsInput = {
      id: testExitDetailsId,
      exit_date: new Date('2024-03-20'),
      proceeds_received: 800000,
      exit_multiple: 8.0,
      notes: 'Multiple field update'
    };

    const result = await updateExitDetails(updateInput);

    expect(result.exit_date).toBeInstanceOf(Date);
    expect((result.exit_date as Date).getTime()).toEqual(new Date('2024-03-20').getTime());
    expect(result.proceeds_received).toEqual(800000);
    expect(result.exit_multiple).toEqual(8.0);
    expect(result.notes).toEqual('Multiple field update');

    // Verify in database
    const exitDetails = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.id, testExitDetailsId))
      .execute();

    expect(exitDetails[0].exit_date).toBeInstanceOf(Date);
    const finalDbExitDate = exitDetails[0].exit_date as Date;
    expect(finalDbExitDate.getTime()).toEqual(new Date('2024-03-20').getTime());
    expect(parseFloat(exitDetails[0].proceeds_received)).toEqual(800000);
    expect(exitDetails[0].exit_multiple).toEqual(8.0);
    expect(exitDetails[0].notes).toEqual('Multiple field update');
  });
});