import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exitDetailsTable, investmentsTable } from '../db/schema';
import { type CreateExitDetailsInput } from '../schema';
import { createExitDetails } from '../handlers/create_exit_details';
import { eq } from 'drizzle-orm';

// Test investment data
const testInvestment = {
  company_name: 'Test Company',
  investment_date: new Date('2023-01-01'),
  amount_invested: '100000.00', // String for numeric column
  funding_round: 'Seed' as const,
  equity_percentage: 10.5,
  current_valuation: '1000000.00', // String for numeric column
  status: 'Active' as const,
  notes: 'Test investment'
};

// Test exit details input
const testExitInput: CreateExitDetailsInput = {
  investment_id: 1, // Will be set after creating investment
  exit_date: new Date('2024-01-01'),
  proceeds_received: 250000.50,
  exit_multiple: 2.5,
  notes: 'Successful exit'
};

describe('createExitDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create exit details for an investment', async () => {
    // Create prerequisite investment
    const investmentResult = await db.insert(investmentsTable)
      .values(testInvestment)
      .returning()
      .execute();

    const investment = investmentResult[0];
    const exitInput = { ...testExitInput, investment_id: investment.id };

    const result = await createExitDetails(exitInput);

    // Basic field validation
    expect(result.investment_id).toEqual(investment.id);
    expect(result.exit_date).toEqual(exitInput.exit_date);
    expect(result.proceeds_received).toEqual(250000.50);
    expect(typeof result.proceeds_received).toBe('number'); // Verify numeric conversion
    expect(result.exit_multiple).toEqual(2.5);
    expect(result.notes).toEqual('Successful exit');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save exit details to database', async () => {
    // Create prerequisite investment
    const investmentResult = await db.insert(investmentsTable)
      .values(testInvestment)
      .returning()
      .execute();

    const investment = investmentResult[0];
    const exitInput = { ...testExitInput, investment_id: investment.id };

    const result = await createExitDetails(exitInput);

    // Query exit details from database
    const exitDetails = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.id, result.id))
      .execute();

    expect(exitDetails).toHaveLength(1);
    expect(exitDetails[0].investment_id).toEqual(investment.id);
    expect(exitDetails[0].exit_date).toEqual(exitInput.exit_date);
    expect(parseFloat(exitDetails[0].proceeds_received)).toEqual(250000.50);
    expect(exitDetails[0].exit_multiple).toEqual(2.5);
    expect(exitDetails[0].notes).toEqual('Successful exit');
    expect(exitDetails[0].created_at).toBeInstanceOf(Date);
  });

  it('should update investment status to Exited', async () => {
    // Create prerequisite investment with Active status
    const investmentResult = await db.insert(investmentsTable)
      .values({ ...testInvestment, status: 'Active' })
      .returning()
      .execute();

    const investment = investmentResult[0];
    const exitInput = { ...testExitInput, investment_id: investment.id };

    await createExitDetails(exitInput);

    // Verify investment status was updated
    const updatedInvestments = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investment.id))
      .execute();

    expect(updatedInvestments[0].status).toEqual('Exited');
    expect(updatedInvestments[0].updated_at).toBeInstanceOf(Date);
    // Should be more recent than original created_at
    expect(updatedInvestments[0].updated_at > investment.created_at).toBe(true);
  });

  it('should not update investment status if already Exited', async () => {
    // Create prerequisite investment with Exited status
    const investmentResult = await db.insert(investmentsTable)
      .values({ ...testInvestment, status: 'Exited' })
      .returning()
      .execute();

    const investment = investmentResult[0];
    const originalUpdatedAt = investment.updated_at;
    const exitInput = { ...testExitInput, investment_id: investment.id };

    await createExitDetails(exitInput);

    // Verify investment status was not changed
    const updatedInvestments = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investment.id))
      .execute();

    expect(updatedInvestments[0].status).toEqual('Exited');
    // updated_at should remain the same since no update was made
    expect(updatedInvestments[0].updated_at).toEqual(originalUpdatedAt);
  });

  it('should handle exit details with null notes', async () => {
    // Create prerequisite investment
    const investmentResult = await db.insert(investmentsTable)
      .values(testInvestment)
      .returning()
      .execute();

    const investment = investmentResult[0];
    const exitInput = { 
      ...testExitInput, 
      investment_id: investment.id,
      notes: null 
    };

    const result = await createExitDetails(exitInput);

    expect(result.notes).toBeNull();
    expect(result.investment_id).toEqual(investment.id);
    expect(result.proceeds_received).toEqual(250000.50);
  });

  it('should throw error when investment does not exist', async () => {
    const exitInput = { ...testExitInput, investment_id: 999 }; // Non-existent ID

    await expect(createExitDetails(exitInput)).rejects.toThrow(/Investment with id 999 not found/i);
  });

  it('should handle large monetary values correctly', async () => {
    // Create prerequisite investment
    const investmentResult = await db.insert(investmentsTable)
      .values(testInvestment)
      .returning()
      .execute();

    const investment = investmentResult[0];
    const exitInput = { 
      ...testExitInput, 
      investment_id: investment.id,
      proceeds_received: 99999999999.99, // Large value
      exit_multiple: 999.99
    };

    const result = await createExitDetails(exitInput);

    expect(result.proceeds_received).toEqual(99999999999.99);
    expect(result.exit_multiple).toEqual(999.99);
    expect(typeof result.proceeds_received).toBe('number');
  });
});