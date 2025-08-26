import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { type UpdateInvestmentInput, type CreateInvestmentInput } from '../schema';
import { updateInvestment } from '../handlers/update_investment';
import { eq } from 'drizzle-orm';

// Test investment data
const testInvestment: CreateInvestmentInput = {
  company_name: 'Original Company',
  investment_date: new Date('2023-01-15'),
  amount_invested: 100000,
  funding_round: 'Seed',
  equity_percentage: 10.5,
  current_valuation: 1000000,
  status: 'Active',
  notes: 'Original notes'
};

describe('updateInvestment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let investmentId: number;

  beforeEach(async () => {
    // Create a test investment for updating
    const result = await db.insert(investmentsTable)
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

    investmentId = result[0].id;
  });

  it('should update all fields of an investment', async () => {
    const updateInput: UpdateInvestmentInput = {
      id: investmentId,
      company_name: 'Updated Company',
      investment_date: new Date('2024-02-20'),
      amount_invested: 250000,
      funding_round: 'Series A',
      equity_percentage: 15.75,
      current_valuation: 2500000,
      status: 'Exited',
      notes: 'Updated notes'
    };

    const result = await updateInvestment(updateInput);

    // Verify all fields are updated correctly
    expect(result.id).toEqual(investmentId);
    expect(result.company_name).toEqual('Updated Company');
    expect(result.investment_date).toEqual(new Date('2024-02-20'));
    expect(result.amount_invested).toEqual(250000);
    expect(typeof result.amount_invested).toEqual('number');
    expect(result.funding_round).toEqual('Series A');
    expect(result.equity_percentage).toEqual(15.75);
    expect(result.current_valuation).toEqual(2500000);
    expect(typeof result.current_valuation).toEqual('number');
    expect(result.status).toEqual('Exited');
    expect(result.notes).toEqual('Updated notes');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update partial fields only', async () => {
    const updateInput: UpdateInvestmentInput = {
      id: investmentId,
      company_name: 'Partially Updated Company',
      amount_invested: 150000,
      status: 'Written Off'
    };

    const result = await updateInvestment(updateInput);

    // Verify only specified fields are updated
    expect(result.company_name).toEqual('Partially Updated Company');
    expect(result.amount_invested).toEqual(150000);
    expect(result.status).toEqual('Written Off');

    // Verify other fields remain unchanged
    expect(result.investment_date).toEqual(testInvestment.investment_date);
    expect(result.funding_round).toEqual(testInvestment.funding_round);
    expect(result.equity_percentage).toEqual(testInvestment.equity_percentage);
    expect(result.current_valuation).toEqual(testInvestment.current_valuation);
    expect(result.notes).toEqual(testInvestment.notes);
  });

  it('should update current_valuation to null', async () => {
    const updateInput: UpdateInvestmentInput = {
      id: investmentId,
      current_valuation: null
    };

    const result = await updateInvestment(updateInput);

    expect(result.current_valuation).toBeNull();
    // Verify other fields remain unchanged
    expect(result.company_name).toEqual(testInvestment.company_name);
    expect(result.amount_invested).toEqual(testInvestment.amount_invested);
  });

  it('should update notes to null', async () => {
    const updateInput: UpdateInvestmentInput = {
      id: investmentId,
      notes: null
    };

    const result = await updateInvestment(updateInput);

    expect(result.notes).toBeNull();
    // Verify other fields remain unchanged
    expect(result.company_name).toEqual(testInvestment.company_name);
    expect(result.status).toEqual(testInvestment.status);
  });

  it('should save updated investment to database', async () => {
    const updateInput: UpdateInvestmentInput = {
      id: investmentId,
      company_name: 'Database Test Company',
      amount_invested: 300000,
      equity_percentage: 20.0,
      status: 'Exited'
    };

    await updateInvestment(updateInput);

    // Query database directly to verify update
    const investments = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investmentId))
      .execute();

    expect(investments).toHaveLength(1);
    const dbInvestment = investments[0];
    expect(dbInvestment.company_name).toEqual('Database Test Company');
    expect(parseFloat(dbInvestment.amount_invested)).toEqual(300000);
    expect(dbInvestment.equity_percentage).toEqual(20.0);
    expect(dbInvestment.status).toEqual('Exited');
    expect(dbInvestment.updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original updated_at
    const originalInvestments = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investmentId))
      .execute();
    const originalUpdatedAt = originalInvestments[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateInvestmentInput = {
      id: investmentId,
      company_name: 'Timestamp Test Company'
    };

    const result = await updateInvestment(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error when investment does not exist', async () => {
    const updateInput: UpdateInvestmentInput = {
      id: 99999, // Non-existent ID
      company_name: 'Non-existent Company'
    };

    expect(updateInvestment(updateInput)).rejects.toThrow(/Investment with id 99999 not found/i);
  });

  it('should handle edge case values correctly', async () => {
    const updateInput: UpdateInvestmentInput = {
      id: investmentId,
      equity_percentage: 0, // Minimum allowed value
      amount_invested: 1 // Minimum positive value
    };

    const result = await updateInvestment(updateInput);

    expect(result.equity_percentage).toEqual(0);
    expect(result.amount_invested).toEqual(1);
    expect(typeof result.amount_invested).toEqual('number');
  });

  it('should update with different funding rounds', async () => {
    const updateInput: UpdateInvestmentInput = {
      id: investmentId,
      funding_round: 'Later Stage'
    };

    const result = await updateInvestment(updateInput);

    expect(result.funding_round).toEqual('Later Stage');
    // Verify other fields remain unchanged
    expect(result.company_name).toEqual(testInvestment.company_name);
    expect(result.amount_invested).toEqual(testInvestment.amount_invested);
  });

  it('should handle high precision numeric values', async () => {
    const updateInput: UpdateInvestmentInput = {
      id: investmentId,
      amount_invested: 1234567.89,
      current_valuation: 9876543.21
    };

    const result = await updateInvestment(updateInput);

    expect(result.amount_invested).toEqual(1234567.89);
    expect(result.current_valuation).toEqual(9876543.21);
    expect(typeof result.amount_invested).toEqual('number');
    expect(typeof result.current_valuation).toEqual('number');
  });
});