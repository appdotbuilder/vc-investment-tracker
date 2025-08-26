import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { type CreateInvestmentInput } from '../schema';
import { createInvestment } from '../handlers/create_investment';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateInvestmentInput = {
  company_name: 'TechCorp Inc.',
  investment_date: new Date('2024-01-15'),
  amount_invested: 500000,
  funding_round: 'Series A',
  equity_percentage: 15.5,
  current_valuation: 5000000,
  status: 'Active',
  notes: 'Promising AI startup with strong team'
};

// Test input with nullable fields
const minimalInput: CreateInvestmentInput = {
  company_name: 'MinimalCorp',
  investment_date: new Date('2024-02-01'),
  amount_invested: 100000,
  funding_round: 'Seed',
  equity_percentage: 5.0,
  current_valuation: null,
  status: 'Active',
  notes: null
};

describe('createInvestment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an investment with all fields', async () => {
    const result = await createInvestment(testInput);

    // Basic field validation
    expect(result.company_name).toEqual('TechCorp Inc.');
    expect(result.investment_date).toEqual(testInput.investment_date);
    expect(result.amount_invested).toEqual(500000);
    expect(typeof result.amount_invested).toEqual('number');
    expect(result.funding_round).toEqual('Series A');
    expect(result.equity_percentage).toEqual(15.5);
    expect(result.current_valuation).toEqual(5000000);
    expect(typeof result.current_valuation).toEqual('number');
    expect(result.status).toEqual('Active');
    expect(result.notes).toEqual('Promising AI startup with strong team');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an investment with nullable fields', async () => {
    const result = await createInvestment(minimalInput);

    expect(result.company_name).toEqual('MinimalCorp');
    expect(result.amount_invested).toEqual(100000);
    expect(typeof result.amount_invested).toEqual('number');
    expect(result.current_valuation).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save investment to database correctly', async () => {
    const result = await createInvestment(testInput);

    // Query using proper drizzle syntax
    const investments = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, result.id))
      .execute();

    expect(investments).toHaveLength(1);
    const savedInvestment = investments[0];
    
    expect(savedInvestment.company_name).toEqual('TechCorp Inc.');
    expect(savedInvestment.investment_date).toEqual(testInput.investment_date);
    expect(parseFloat(savedInvestment.amount_invested)).toEqual(500000);
    expect(savedInvestment.funding_round).toEqual('Series A');
    expect(savedInvestment.equity_percentage).toEqual(15.5);
    expect(parseFloat(savedInvestment.current_valuation!)).toEqual(5000000);
    expect(savedInvestment.status).toEqual('Active');
    expect(savedInvestment.notes).toEqual('Promising AI startup with strong team');
    expect(savedInvestment.created_at).toBeInstanceOf(Date);
    expect(savedInvestment.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different funding rounds', async () => {
    const seedInput: CreateInvestmentInput = {
      ...testInput,
      company_name: 'SeedCorp',
      funding_round: 'Seed'
    };

    const preSeedInput: CreateInvestmentInput = {
      ...testInput,
      company_name: 'PreSeedCorp',
      funding_round: 'Pre-Seed'
    };

    const laterStageInput: CreateInvestmentInput = {
      ...testInput,
      company_name: 'LaterStageCorp',
      funding_round: 'Later Stage'
    };

    const seedResult = await createInvestment(seedInput);
    const preSeedResult = await createInvestment(preSeedInput);
    const laterStageResult = await createInvestment(laterStageInput);

    expect(seedResult.funding_round).toEqual('Seed');
    expect(preSeedResult.funding_round).toEqual('Pre-Seed');
    expect(laterStageResult.funding_round).toEqual('Later Stage');
  });

  it('should handle different investment statuses', async () => {
    const activeInput: CreateInvestmentInput = {
      ...testInput,
      company_name: 'ActiveCorp',
      status: 'Active'
    };

    const exitedInput: CreateInvestmentInput = {
      ...testInput,
      company_name: 'ExitedCorp',
      status: 'Exited'
    };

    const writtenOffInput: CreateInvestmentInput = {
      ...testInput,
      company_name: 'WrittenOffCorp',
      status: 'Written Off'
    };

    const activeResult = await createInvestment(activeInput);
    const exitedResult = await createInvestment(exitedInput);
    const writtenOffResult = await createInvestment(writtenOffInput);

    expect(activeResult.status).toEqual('Active');
    expect(exitedResult.status).toEqual('Exited');
    expect(writtenOffResult.status).toEqual('Written Off');
  });

  it('should create multiple investments with unique IDs', async () => {
    const firstInput: CreateInvestmentInput = {
      ...testInput,
      company_name: 'FirstCorp'
    };

    const secondInput: CreateInvestmentInput = {
      ...testInput,
      company_name: 'SecondCorp'
    };

    const firstResult = await createInvestment(firstInput);
    const secondResult = await createInvestment(secondInput);

    expect(firstResult.id).toBeDefined();
    expect(secondResult.id).toBeDefined();
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.company_name).toEqual('FirstCorp');
    expect(secondResult.company_name).toEqual('SecondCorp');
  });

  it('should handle edge cases for numeric values', async () => {
    const edgeCaseInput: CreateInvestmentInput = {
      company_name: 'EdgeCorp',
      investment_date: new Date('2024-03-01'),
      amount_invested: 0.01, // Very small amount
      funding_round: 'Pre-Seed',
      equity_percentage: 0.1, // Very small percentage
      current_valuation: 999999999.99, // Large valuation
      status: 'Active',
      notes: null
    };

    const result = await createInvestment(edgeCaseInput);

    expect(result.amount_invested).toEqual(0.01);
    expect(typeof result.amount_invested).toEqual('number');
    expect(result.equity_percentage).toEqual(0.1);
    expect(result.current_valuation).toEqual(999999999.99);
    expect(typeof result.current_valuation).toEqual('number');
  });
});