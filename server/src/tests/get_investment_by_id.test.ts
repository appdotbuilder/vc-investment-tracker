import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { type GetInvestmentByIdInput } from '../schema';
import { getInvestmentById } from '../handlers/get_investment_by_id';

describe('getInvestmentById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an investment when it exists', async () => {
    // Create a test investment first
    const testInvestment = await db.insert(investmentsTable)
      .values({
        company_name: 'Test Company',
        investment_date: new Date('2024-01-15'),
        amount_invested: '50000.00',
        funding_round: 'Seed',
        equity_percentage: 5.5,
        current_valuation: '1000000.00',
        status: 'Active',
        notes: 'Initial seed investment'
      })
      .returning()
      .execute();

    const investmentId = testInvestment[0].id;
    const input: GetInvestmentByIdInput = { id: investmentId };

    // Test the handler
    const result = await getInvestmentById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(investmentId);
    expect(result!.company_name).toEqual('Test Company');
    expect(result!.investment_date).toBeInstanceOf(Date);
    expect(result!.investment_date.toISOString()).toEqual('2024-01-15T00:00:00.000Z');
    expect(result!.amount_invested).toEqual(50000);
    expect(typeof result!.amount_invested).toBe('number');
    expect(result!.funding_round).toEqual('Seed');
    expect(result!.equity_percentage).toEqual(5.5);
    expect(result!.current_valuation).toEqual(1000000);
    expect(typeof result!.current_valuation).toBe('number');
    expect(result!.status).toEqual('Active');
    expect(result!.notes).toEqual('Initial seed investment');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when investment does not exist', async () => {
    const input: GetInvestmentByIdInput = { id: 999 };

    const result = await getInvestmentById(input);

    expect(result).toBeNull();
  });

  it('should handle investment with null current_valuation', async () => {
    // Create investment with null current_valuation
    const testInvestment = await db.insert(investmentsTable)
      .values({
        company_name: 'Early Stage Co',
        investment_date: new Date('2024-02-20'),
        amount_invested: '25000.50',
        funding_round: 'Pre-Seed',
        equity_percentage: 10.0,
        current_valuation: null, // Explicitly null
        status: 'Active',
        notes: null
      })
      .returning()
      .execute();

    const input: GetInvestmentByIdInput = { id: testInvestment[0].id };

    const result = await getInvestmentById(input);

    expect(result).not.toBeNull();
    expect(result!.current_valuation).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.amount_invested).toEqual(25000.5);
    expect(typeof result!.amount_invested).toBe('number');
  });

  it('should handle investment with all funding rounds', async () => {
    const fundingRounds = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Later Stage', 'Bridge'] as const;

    for (const round of fundingRounds) {
      // Create investment for each funding round
      const testInvestment = await db.insert(investmentsTable)
        .values({
          company_name: `${round} Company`,
          investment_date: new Date('2024-03-01'),
          amount_invested: '100000.00',
          funding_round: round,
          equity_percentage: 2.5,
          current_valuation: '5000000.00',
          status: 'Active',
          notes: `${round} funding round`
        })
        .returning()
        .execute();

      const input: GetInvestmentByIdInput = { id: testInvestment[0].id };
      const result = await getInvestmentById(input);

      expect(result).not.toBeNull();
      expect(result!.funding_round).toEqual(round);
      expect(result!.company_name).toEqual(`${round} Company`);
    }
  });

  it('should handle investment with all statuses', async () => {
    const statuses = ['Active', 'Exited', 'Written Off'] as const;

    for (const status of statuses) {
      // Create investment for each status
      const testInvestment = await db.insert(investmentsTable)
        .values({
          company_name: `${status} Company`,
          investment_date: new Date('2024-04-01'),
          amount_invested: '75000.25',
          funding_round: 'Series A',
          equity_percentage: 3.75,
          current_valuation: '2500000.50',
          status: status,
          notes: `Investment with ${status} status`
        })
        .returning()
        .execute();

      const input: GetInvestmentByIdInput = { id: testInvestment[0].id };
      const result = await getInvestmentById(input);

      expect(result).not.toBeNull();
      expect(result!.status).toEqual(status);
      expect(result!.amount_invested).toEqual(75000.25);
      expect(result!.current_valuation).toEqual(2500000.5);
    }
  });

  it('should handle decimal precision correctly', async () => {
    // Test with precise decimal values
    const testInvestment = await db.insert(investmentsTable)
      .values({
        company_name: 'Precision Co',
        investment_date: new Date('2024-05-15'),
        amount_invested: '123456.78', // Two decimal places
        funding_round: 'Series B',
        equity_percentage: 1.25,
        current_valuation: '9876543.21', // Two decimal places
        status: 'Active',
        notes: 'Testing decimal precision'
      })
      .returning()
      .execute();

    const input: GetInvestmentByIdInput = { id: testInvestment[0].id };
    const result = await getInvestmentById(input);

    expect(result).not.toBeNull();
    expect(result!.amount_invested).toEqual(123456.78);
    expect(result!.current_valuation).toEqual(9876543.21);
    expect(typeof result!.amount_invested).toBe('number');
    expect(typeof result!.current_valuation).toBe('number');
  });
});