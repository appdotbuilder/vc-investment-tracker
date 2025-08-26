import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investmentsTable, exitDetailsTable } from '../db/schema';
import { type GetExitDetailsByInvestmentIdInput } from '../schema';
import { getExitDetailsByInvestmentId } from '../handlers/get_exit_details_by_investment_id';

describe('getExitDetailsByInvestmentId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return exit details when they exist', async () => {
    // Create test investment first
    const investment = await db.insert(investmentsTable)
      .values({
        company_name: 'Test Company',
        investment_date: new Date('2023-01-01'),
        amount_invested: '100000.00',
        funding_round: 'Seed',
        equity_percentage: 10.5,
        current_valuation: '1000000.00',
        status: 'Exited',
        notes: 'Test investment'
      })
      .returning()
      .execute();

    const investmentId = investment[0].id;

    // Create test exit details
    const exitDetailsData = {
      investment_id: investmentId,
      exit_date: new Date('2023-12-01'),
      proceeds_received: '250000.00',
      exit_multiple: 2.5,
      notes: 'Successful exit'
    };

    await db.insert(exitDetailsTable)
      .values(exitDetailsData)
      .execute();

    // Test the handler
    const input: GetExitDetailsByInvestmentIdInput = {
      investment_id: investmentId
    };

    const result = await getExitDetailsByInvestmentId(input);

    // Verify result
    expect(result).toBeDefined();
    expect(result!.investment_id).toEqual(investmentId);
    expect(result!.exit_date).toEqual(new Date('2023-12-01'));
    expect(result!.proceeds_received).toEqual(250000);
    expect(typeof result!.proceeds_received).toEqual('number');
    expect(result!.exit_multiple).toEqual(2.5);
    expect(result!.notes).toEqual('Successful exit');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.id).toBeDefined();
  });

  it('should return null when exit details do not exist', async () => {
    // Create test investment first
    const investment = await db.insert(investmentsTable)
      .values({
        company_name: 'Test Company',
        investment_date: new Date('2023-01-01'),
        amount_invested: '100000.00',
        funding_round: 'Seed',
        equity_percentage: 10.5,
        current_valuation: '1000000.00',
        status: 'Active',
        notes: 'Test investment'
      })
      .returning()
      .execute();

    const investmentId = investment[0].id;

    // Test the handler without creating exit details
    const input: GetExitDetailsByInvestmentIdInput = {
      investment_id: investmentId
    };

    const result = await getExitDetailsByInvestmentId(input);

    expect(result).toBeNull();
  });

  it('should return null for non-existent investment ID', async () => {
    const input: GetExitDetailsByInvestmentIdInput = {
      investment_id: 99999 // Non-existent investment ID
    };

    const result = await getExitDetailsByInvestmentId(input);

    expect(result).toBeNull();
  });

  it('should handle zero proceeds correctly', async () => {
    // Create test investment first
    const investment = await db.insert(investmentsTable)
      .values({
        company_name: 'Failed Company',
        investment_date: new Date('2023-01-01'),
        amount_invested: '100000.00',
        funding_round: 'Seed',
        equity_percentage: 15.0,
        current_valuation: null,
        status: 'Written Off',
        notes: 'Failed investment'
      })
      .returning()
      .execute();

    const investmentId = investment[0].id;

    // Create exit details with zero proceeds
    await db.insert(exitDetailsTable)
      .values({
        investment_id: investmentId,
        exit_date: new Date('2023-06-01'),
        proceeds_received: '0.00',
        exit_multiple: 0.0,
        notes: 'Complete loss'
      })
      .execute();

    // Test the handler
    const input: GetExitDetailsByInvestmentIdInput = {
      investment_id: investmentId
    };

    const result = await getExitDetailsByInvestmentId(input);

    expect(result).toBeDefined();
    expect(result!.proceeds_received).toEqual(0);
    expect(typeof result!.proceeds_received).toEqual('number');
    expect(result!.exit_multiple).toEqual(0);
    expect(result!.notes).toEqual('Complete loss');
  });

  it('should handle large monetary amounts correctly', async () => {
    // Create test investment first
    const investment = await db.insert(investmentsTable)
      .values({
        company_name: 'Unicorn Company',
        investment_date: new Date('2023-01-01'),
        amount_invested: '5000000.00',
        funding_round: 'Series A',
        equity_percentage: 5.0,
        current_valuation: '100000000.00',
        status: 'Exited',
        notes: 'Big investment'
      })
      .returning()
      .execute();

    const investmentId = investment[0].id;

    // Create exit details with large amounts
    await db.insert(exitDetailsTable)
      .values({
        investment_id: investmentId,
        exit_date: new Date('2023-12-15'),
        proceeds_received: '50000000.00',
        exit_multiple: 10.0,
        notes: 'Massive success'
      })
      .execute();

    // Test the handler
    const input: GetExitDetailsByInvestmentIdInput = {
      investment_id: investmentId
    };

    const result = await getExitDetailsByInvestmentId(input);

    expect(result).toBeDefined();
    expect(result!.proceeds_received).toEqual(50000000);
    expect(typeof result!.proceeds_received).toEqual('number');
    expect(result!.exit_multiple).toEqual(10.0);
    expect(result!.notes).toEqual('Massive success');
  });
});