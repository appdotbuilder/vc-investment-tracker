import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investmentsTable, exitDetailsTable } from '../db/schema';
import { type DeleteExitDetailsInput, type CreateInvestmentInput, type CreateExitDetailsInput } from '../schema';
import { deleteExitDetails } from '../handlers/delete_exit_details';
import { eq } from 'drizzle-orm';

// Test data
const testInvestment: CreateInvestmentInput = {
  company_name: 'Test Company',
  investment_date: new Date('2023-01-01'),
  amount_invested: 100000,
  funding_round: 'Seed',
  equity_percentage: 10,
  current_valuation: 1000000,
  status: 'Exited',
  notes: 'Test investment'
};

const testExitDetails: CreateExitDetailsInput = {
  investment_id: 1,
  exit_date: new Date('2024-01-01'),
  proceeds_received: 200000,
  exit_multiple: 2.0,
  notes: 'Successful exit'
};

describe('deleteExitDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete exit details successfully', async () => {
    // Create investment first
    const investmentResult = await db.insert(investmentsTable)
      .values({
        company_name: testInvestment.company_name,
        investment_date: testInvestment.investment_date,
        amount_invested: testInvestment.amount_invested.toString(),
        funding_round: testInvestment.funding_round,
        equity_percentage: testInvestment.equity_percentage,
        current_valuation: testInvestment.current_valuation?.toString() || null,
        status: testInvestment.status,
        notes: testInvestment.notes
      })
      .returning()
      .execute();

    const investmentId = investmentResult[0].id;

    // Create exit details
    const exitDetailsResult = await db.insert(exitDetailsTable)
      .values({
        investment_id: investmentId,
        exit_date: testExitDetails.exit_date,
        proceeds_received: testExitDetails.proceeds_received.toString(),
        exit_multiple: testExitDetails.exit_multiple,
        notes: testExitDetails.notes
      })
      .returning()
      .execute();

    const exitDetailsId = exitDetailsResult[0].id;

    const input: DeleteExitDetailsInput = { id: exitDetailsId };
    const result = await deleteExitDetails(input);

    expect(result.success).toBe(true);

    // Verify exit details is deleted
    const exitDetailsAfterDelete = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.id, exitDetailsId))
      .execute();

    expect(exitDetailsAfterDelete).toHaveLength(0);
  });

  it('should update investment status to Active after deleting exit details', async () => {
    // Create investment with Exited status
    const investmentResult = await db.insert(investmentsTable)
      .values({
        company_name: testInvestment.company_name,
        investment_date: testInvestment.investment_date,
        amount_invested: testInvestment.amount_invested.toString(),
        funding_round: testInvestment.funding_round,
        equity_percentage: testInvestment.equity_percentage,
        current_valuation: testInvestment.current_valuation?.toString() || null,
        status: 'Exited',
        notes: testInvestment.notes
      })
      .returning()
      .execute();

    const investmentId = investmentResult[0].id;

    // Create exit details
    const exitDetailsResult = await db.insert(exitDetailsTable)
      .values({
        investment_id: investmentId,
        exit_date: testExitDetails.exit_date,
        proceeds_received: testExitDetails.proceeds_received.toString(),
        exit_multiple: testExitDetails.exit_multiple,
        notes: testExitDetails.notes
      })
      .returning()
      .execute();

    const exitDetailsId = exitDetailsResult[0].id;

    const input: DeleteExitDetailsInput = { id: exitDetailsId };
    await deleteExitDetails(input);

    // Verify investment status is updated to Active
    const updatedInvestment = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investmentId))
      .execute();

    expect(updatedInvestment).toHaveLength(1);
    expect(updatedInvestment[0].status).toEqual('Active');
    expect(updatedInvestment[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when exit details not found', async () => {
    const input: DeleteExitDetailsInput = { id: 999 };

    expect(deleteExitDetails(input)).rejects.toThrow(/Exit details with id 999 not found/i);
  });

  it('should handle investment status update correctly', async () => {
    // Create investment with Active status initially
    const investmentResult = await db.insert(investmentsTable)
      .values({
        company_name: 'Active Company',
        investment_date: new Date('2023-01-01'),
        amount_invested: '50000',
        funding_round: 'Pre-Seed',
        equity_percentage: 5,
        current_valuation: '500000',
        status: 'Active',
        notes: 'Active investment'
      })
      .returning()
      .execute();

    const investmentId = investmentResult[0].id;

    // Create exit details
    const exitDetailsResult = await db.insert(exitDetailsTable)
      .values({
        investment_id: investmentId,
        exit_date: new Date('2024-06-01'),
        proceeds_received: '75000',
        exit_multiple: 1.5,
        notes: 'Partial exit'
      })
      .returning()
      .execute();

    const exitDetailsId = exitDetailsResult[0].id;

    const input: DeleteExitDetailsInput = { id: exitDetailsId };
    const result = await deleteExitDetails(input);

    expect(result.success).toBe(true);

    // Verify investment is still set to Active (even though it was already Active)
    const updatedInvestment = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investmentId))
      .execute();

    expect(updatedInvestment[0].status).toEqual('Active');
  });

  it('should handle multiple exit details deletion scenarios', async () => {
    // Create investment
    const investmentResult = await db.insert(investmentsTable)
      .values({
        company_name: 'Multi Exit Company',
        investment_date: new Date('2023-01-01'),
        amount_invested: '200000',
        funding_round: 'Series A',
        equity_percentage: 15,
        current_valuation: '2000000',
        status: 'Exited',
        notes: 'Multiple exits possible'
      })
      .returning()
      .execute();

    const investmentId = investmentResult[0].id;

    // Create first exit details
    const exitDetailsResult1 = await db.insert(exitDetailsTable)
      .values({
        investment_id: investmentId,
        exit_date: new Date('2024-01-01'),
        proceeds_received: '300000',
        exit_multiple: 1.5,
        notes: 'First exit'
      })
      .returning()
      .execute();

    const exitDetailsId1 = exitDetailsResult1[0].id;

    // Delete the exit details
    const input: DeleteExitDetailsInput = { id: exitDetailsId1 };
    const result = await deleteExitDetails(input);

    expect(result.success).toBe(true);

    // Verify the exit details was deleted
    const remainingExitDetails = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.investment_id, investmentId))
      .execute();

    expect(remainingExitDetails).toHaveLength(0);

    // Verify investment status is updated to Active
    const finalInvestment = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investmentId))
      .execute();

    expect(finalInvestment[0].status).toEqual('Active');
  });
});