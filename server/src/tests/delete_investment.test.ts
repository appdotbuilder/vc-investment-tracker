import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investmentsTable, exitDetailsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInvestmentInput, type CreateInvestmentInput, type CreateExitDetailsInput } from '../schema';
import { deleteInvestment } from '../handlers/delete_investment';

// Test input for deleting investment
const testDeleteInput: DeleteInvestmentInput = {
  id: 1
};

// Test input for creating investment
const testInvestmentInput: CreateInvestmentInput = {
  company_name: 'Test Company',
  investment_date: new Date('2023-01-01'),
  amount_invested: 100000,
  funding_round: 'Seed',
  equity_percentage: 10.5,
  current_valuation: 1000000,
  status: 'Active',
  notes: 'Test investment'
};

// Test input for creating exit details
const testExitDetailsInput: CreateExitDetailsInput = {
  investment_id: 1,
  exit_date: new Date('2024-01-01'),
  proceeds_received: 200000,
  exit_multiple: 2.0,
  notes: 'Successful exit'
};

describe('deleteInvestment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing investment', async () => {
    // Create a test investment first
    const createdInvestment = await db.insert(investmentsTable)
      .values({
        company_name: testInvestmentInput.company_name,
        investment_date: testInvestmentInput.investment_date,
        amount_invested: testInvestmentInput.amount_invested.toString(),
        funding_round: testInvestmentInput.funding_round,
        equity_percentage: testInvestmentInput.equity_percentage,
        current_valuation: testInvestmentInput.current_valuation?.toString() || null,
        status: testInvestmentInput.status,
        notes: testInvestmentInput.notes
      })
      .returning()
      .execute();

    const investmentId = createdInvestment[0].id;

    // Delete the investment
    const result = await deleteInvestment({ id: investmentId });

    // Should return success: true
    expect(result.success).toBe(true);

    // Verify investment was deleted from database
    const investments = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investmentId))
      .execute();

    expect(investments).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent investment', async () => {
    // Try to delete an investment that doesn't exist
    const result = await deleteInvestment({ id: 999 });

    // Should return success: false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should cascade delete related exit details', async () => {
    // Create a test investment first
    const createdInvestment = await db.insert(investmentsTable)
      .values({
        company_name: testInvestmentInput.company_name,
        investment_date: testInvestmentInput.investment_date,
        amount_invested: testInvestmentInput.amount_invested.toString(),
        funding_round: testInvestmentInput.funding_round,
        equity_percentage: testInvestmentInput.equity_percentage,
        current_valuation: testInvestmentInput.current_valuation?.toString() || null,
        status: testInvestmentInput.status,
        notes: testInvestmentInput.notes
      })
      .returning()
      .execute();

    const investmentId = createdInvestment[0].id;

    // Create exit details for the investment
    await db.insert(exitDetailsTable)
      .values({
        investment_id: investmentId,
        exit_date: testExitDetailsInput.exit_date,
        proceeds_received: testExitDetailsInput.proceeds_received.toString(),
        exit_multiple: testExitDetailsInput.exit_multiple,
        notes: testExitDetailsInput.notes
      })
      .execute();

    // Verify exit details exist before deletion
    const exitDetailsBefore = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.investment_id, investmentId))
      .execute();

    expect(exitDetailsBefore).toHaveLength(1);

    // Delete the investment
    const result = await deleteInvestment({ id: investmentId });

    // Should return success: true
    expect(result.success).toBe(true);

    // Verify investment was deleted
    const investments = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investmentId))
      .execute();

    expect(investments).toHaveLength(0);

    // Verify exit details were cascade deleted
    const exitDetailsAfter = await db.select()
      .from(exitDetailsTable)
      .where(eq(exitDetailsTable.investment_id, investmentId))
      .execute();

    expect(exitDetailsAfter).toHaveLength(0);
  });

  it('should handle deletion of multiple investments independently', async () => {
    // Create two test investments
    const investment1 = await db.insert(investmentsTable)
      .values({
        company_name: 'Company 1',
        investment_date: new Date('2023-01-01'),
        amount_invested: '100000',
        funding_round: 'Seed',
        equity_percentage: 10.5,
        current_valuation: '1000000',
        status: 'Active',
        notes: 'First investment'
      })
      .returning()
      .execute();

    const investment2 = await db.insert(investmentsTable)
      .values({
        company_name: 'Company 2',
        investment_date: new Date('2023-02-01'),
        amount_invested: '200000',
        funding_round: 'Series A',
        equity_percentage: 15.0,
        current_valuation: '2000000',
        status: 'Active',
        notes: 'Second investment'
      })
      .returning()
      .execute();

    const investmentId1 = investment1[0].id;
    const investmentId2 = investment2[0].id;

    // Delete first investment
    const result1 = await deleteInvestment({ id: investmentId1 });
    expect(result1.success).toBe(true);

    // Verify first investment is deleted but second still exists
    const remaining = await db.select()
      .from(investmentsTable)
      .execute();

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(investmentId2);
    expect(remaining[0].company_name).toBe('Company 2');

    // Delete second investment
    const result2 = await deleteInvestment({ id: investmentId2 });
    expect(result2.success).toBe(true);

    // Verify all investments are deleted
    const finalCount = await db.select()
      .from(investmentsTable)
      .execute();

    expect(finalCount).toHaveLength(0);
  });
});