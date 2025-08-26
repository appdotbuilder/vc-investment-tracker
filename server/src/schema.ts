import { z } from 'zod';

// Investment status enum
export const investmentStatusSchema = z.enum(['Active', 'Exited', 'Written Off']);
export type InvestmentStatus = z.infer<typeof investmentStatusSchema>;

// Funding round enum
export const fundingRoundSchema = z.enum(['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Later Stage', 'Bridge']);
export type FundingRound = z.infer<typeof fundingRoundSchema>;

// Investment schema
export const investmentSchema = z.object({
  id: z.number(),
  company_name: z.string(),
  investment_date: z.coerce.date(),
  amount_invested: z.number(),
  funding_round: fundingRoundSchema,
  equity_percentage: z.number(),
  current_valuation: z.number().nullable(),
  status: investmentStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Investment = z.infer<typeof investmentSchema>;

// Exit details schema
export const exitDetailsSchema = z.object({
  id: z.number(),
  investment_id: z.number(),
  exit_date: z.coerce.date(),
  proceeds_received: z.number(),
  exit_multiple: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ExitDetails = z.infer<typeof exitDetailsSchema>;

// Input schema for creating investments
export const createInvestmentInputSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  investment_date: z.coerce.date(),
  amount_invested: z.number().positive("Amount invested must be positive"),
  funding_round: fundingRoundSchema,
  equity_percentage: z.number().min(0).max(100, "Equity percentage must be between 0 and 100"),
  current_valuation: z.number().positive().nullable(),
  status: investmentStatusSchema,
  notes: z.string().nullable()
});

export type CreateInvestmentInput = z.infer<typeof createInvestmentInputSchema>;

// Input schema for updating investments
export const updateInvestmentInputSchema = z.object({
  id: z.number(),
  company_name: z.string().min(1).optional(),
  investment_date: z.coerce.date().optional(),
  amount_invested: z.number().positive().optional(),
  funding_round: fundingRoundSchema.optional(),
  equity_percentage: z.number().min(0).max(100).optional(),
  current_valuation: z.number().positive().nullable().optional(),
  status: investmentStatusSchema.optional(),
  notes: z.string().nullable().optional()
});

export type UpdateInvestmentInput = z.infer<typeof updateInvestmentInputSchema>;

// Input schema for creating exit details
export const createExitDetailsInputSchema = z.object({
  investment_id: z.number(),
  exit_date: z.coerce.date(),
  proceeds_received: z.number().nonnegative("Proceeds received must be non-negative"),
  exit_multiple: z.number().positive("Exit multiple must be positive"),
  notes: z.string().nullable()
});

export type CreateExitDetailsInput = z.infer<typeof createExitDetailsInputSchema>;

// Input schema for updating exit details
export const updateExitDetailsInputSchema = z.object({
  id: z.number(),
  exit_date: z.coerce.date().optional(),
  proceeds_received: z.number().nonnegative().optional(),
  exit_multiple: z.number().positive().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateExitDetailsInput = z.infer<typeof updateExitDetailsInputSchema>;

// Query schema for getting investment by ID
export const getInvestmentByIdInputSchema = z.object({
  id: z.number()
});

export type GetInvestmentByIdInput = z.infer<typeof getInvestmentByIdInputSchema>;

// Query schema for getting exit details by investment ID
export const getExitDetailsByInvestmentIdInputSchema = z.object({
  investment_id: z.number()
});

export type GetExitDetailsByInvestmentIdInput = z.infer<typeof getExitDetailsByInvestmentIdInputSchema>;

// Delete schema
export const deleteInvestmentInputSchema = z.object({
  id: z.number()
});

export type DeleteInvestmentInput = z.infer<typeof deleteInvestmentInputSchema>;

export const deleteExitDetailsInputSchema = z.object({
  id: z.number()
});

export type DeleteExitDetailsInput = z.infer<typeof deleteExitDetailsInputSchema>;