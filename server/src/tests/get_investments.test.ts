import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { getInvestments } from '../handlers/get_investments';

describe('getInvestments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no investments exist', async () => {
    const result = await getInvestments();
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all investments with correct data types', async () => {
    // Create test investments
    await db.insert(investmentsTable)
      .values([
        {
          company_name: 'TechStart Inc',
          investment_date: new Date('2023-01-15'),
          amount_invested: '100000.00',
          funding_round: 'Seed',
          equity_percentage: 5.5,
          current_valuation: '2000000.00',
          status: 'Active',
          notes: 'Promising AI startup'
        },
        {
          company_name: 'GrowthCorp',
          investment_date: new Date('2023-06-20'),
          amount_invested: '250000.00',
          funding_round: 'Series A',
          equity_percentage: 3.2,
          current_valuation: null, // Test nullable valuation
          status: 'Exited',
          notes: null // Test nullable notes
        }
      ])
      .execute();

    const result = await getInvestments();

    expect(result).toHaveLength(2);

    // Find investments by company name since order may vary for same created_at
    const techStartInvestment = result.find(inv => inv.company_name === 'TechStart Inc');
    const growthCorpInvestment = result.find(inv => inv.company_name === 'GrowthCorp');

    // Check TechStart Inc investment
    expect(techStartInvestment).toBeDefined();
    expect(techStartInvestment!.company_name).toBe('TechStart Inc');
    expect(techStartInvestment!.investment_date).toBeInstanceOf(Date);
    expect(typeof techStartInvestment!.amount_invested).toBe('number');
    expect(techStartInvestment!.amount_invested).toBe(100000);
    expect(techStartInvestment!.funding_round).toBe('Seed');
    expect(typeof techStartInvestment!.equity_percentage).toBe('number');
    expect(techStartInvestment!.equity_percentage).toBe(5.5);
    expect(typeof techStartInvestment!.current_valuation).toBe('number');
    expect(techStartInvestment!.current_valuation).toBe(2000000);
    expect(techStartInvestment!.status).toBe('Active');
    expect(techStartInvestment!.notes).toBe('Promising AI startup');
    expect(techStartInvestment!.id).toBeDefined();
    expect(techStartInvestment!.created_at).toBeInstanceOf(Date);
    expect(techStartInvestment!.updated_at).toBeInstanceOf(Date);

    // Check GrowthCorp investment
    expect(growthCorpInvestment).toBeDefined();
    expect(growthCorpInvestment!.company_name).toBe('GrowthCorp');
    expect(growthCorpInvestment!.investment_date).toBeInstanceOf(Date);
    expect(typeof growthCorpInvestment!.amount_invested).toBe('number');
    expect(growthCorpInvestment!.amount_invested).toBe(250000);
    expect(growthCorpInvestment!.funding_round).toBe('Series A');
    expect(typeof growthCorpInvestment!.equity_percentage).toBe('number');
    expect(growthCorpInvestment!.equity_percentage).toBe(3.2);
    expect(growthCorpInvestment!.current_valuation).toBe(null);
    expect(growthCorpInvestment!.status).toBe('Exited');
    expect(growthCorpInvestment!.notes).toBe(null);
    expect(growthCorpInvestment!.id).toBeDefined();
    expect(growthCorpInvestment!.created_at).toBeInstanceOf(Date);
    expect(growthCorpInvestment!.updated_at).toBeInstanceOf(Date);
  });

  it('should return investments ordered by creation date (newest first)', async () => {
    // Create investments with slight time differences
    const firstInvestment = await db.insert(investmentsTable)
      .values({
        company_name: 'First Company',
        investment_date: new Date('2023-01-01'),
        amount_invested: '50000.00',
        funding_round: 'Pre-Seed',
        equity_percentage: 2.0,
        current_valuation: '500000.00',
        status: 'Active',
        notes: 'First investment'
      })
      .returning()
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondInvestment = await db.insert(investmentsTable)
      .values({
        company_name: 'Second Company',
        investment_date: new Date('2023-06-01'),
        amount_invested: '75000.00',
        funding_round: 'Seed',
        equity_percentage: 3.0,
        current_valuation: '1000000.00',
        status: 'Active',
        notes: 'Second investment'
      })
      .returning()
      .execute();

    const result = await getInvestments();

    expect(result).toHaveLength(2);
    
    // First result should be the most recently created (Second Company)
    expect(result[0].company_name).toBe('Second Company');
    expect(result[1].company_name).toBe('First Company');
    
    // Verify ordering by created_at
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle different investment statuses and funding rounds', async () => {
    await db.insert(investmentsTable)
      .values([
        {
          company_name: 'Active Startup',
          investment_date: new Date('2023-01-01'),
          amount_invested: '100000.00',
          funding_round: 'Pre-Seed',
          equity_percentage: 5.0,
          current_valuation: '1000000.00',
          status: 'Active',
          notes: 'Active investment'
        },
        {
          company_name: 'Exited Company',
          investment_date: new Date('2022-01-01'),
          amount_invested: '200000.00',
          funding_round: 'Series B',
          equity_percentage: 2.5,
          current_valuation: '5000000.00',
          status: 'Exited',
          notes: 'Successful exit'
        },
        {
          company_name: 'Failed Startup',
          investment_date: new Date('2021-01-01'),
          amount_invested: '150000.00',
          funding_round: 'Later Stage',
          equity_percentage: 1.8,
          current_valuation: null,
          status: 'Written Off',
          notes: 'Investment written off'
        }
      ])
      .execute();

    const result = await getInvestments();
    expect(result).toHaveLength(3);

    // Check that all different statuses and funding rounds are present
    const statuses = result.map(inv => inv.status);
    const fundingRounds = result.map(inv => inv.funding_round);
    
    expect(statuses).toContain('Active');
    expect(statuses).toContain('Exited');
    expect(statuses).toContain('Written Off');
    
    expect(fundingRounds).toContain('Pre-Seed');
    expect(fundingRounds).toContain('Series B');
    expect(fundingRounds).toContain('Later Stage');
  });

  it('should handle large numeric values correctly', async () => {
    // Test with very large investment amounts and valuations
    await db.insert(investmentsTable)
      .values({
        company_name: 'Unicorn Startup',
        investment_date: new Date('2023-01-01'),
        amount_invested: '9999999999.99', // Large amount
        funding_round: 'Series C',
        equity_percentage: 0.1, // Small percentage
        current_valuation: '50000000000.00', // Very large valuation
        status: 'Active',
        notes: 'Major investment'
      })
      .execute();

    const result = await getInvestments();
    expect(result).toHaveLength(1);
    
    const investment = result[0];
    expect(typeof investment.amount_invested).toBe('number');
    expect(investment.amount_invested).toBe(9999999999.99);
    expect(typeof investment.current_valuation).toBe('number');
    expect(investment.current_valuation).toBe(50000000000);
    expect(typeof investment.equity_percentage).toBe('number');
    expect(investment.equity_percentage).toBe(0.1);
  });
});