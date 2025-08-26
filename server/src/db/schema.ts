import { serial, text, pgTable, timestamp, numeric, real, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const investmentStatusEnum = pgEnum('investment_status', ['Active', 'Exited', 'Written Off']);
export const fundingRoundEnum = pgEnum('funding_round', ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Later Stage', 'Bridge']);

// Investments table
export const investmentsTable = pgTable('investments', {
  id: serial('id').primaryKey(),
  company_name: text('company_name').notNull(),
  investment_date: timestamp('investment_date').notNull(),
  amount_invested: numeric('amount_invested', { precision: 15, scale: 2 }).notNull(),
  funding_round: fundingRoundEnum('funding_round').notNull(),
  equity_percentage: real('equity_percentage').notNull(),
  current_valuation: numeric('current_valuation', { precision: 15, scale: 2 }),
  status: investmentStatusEnum('status').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Exit details table
export const exitDetailsTable = pgTable('exit_details', {
  id: serial('id').primaryKey(),
  investment_id: serial('investment_id').notNull().references(() => investmentsTable.id, { onDelete: 'cascade' }),
  exit_date: timestamp('exit_date').notNull(),
  proceeds_received: numeric('proceeds_received', { precision: 15, scale: 2 }).notNull(),
  exit_multiple: real('exit_multiple').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const investmentsRelations = relations(investmentsTable, ({ one }) => ({
  exitDetails: one(exitDetailsTable, {
    fields: [investmentsTable.id],
    references: [exitDetailsTable.investment_id]
  })
}));

export const exitDetailsRelations = relations(exitDetailsTable, ({ one }) => ({
  investment: one(investmentsTable, {
    fields: [exitDetailsTable.investment_id],
    references: [investmentsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Investment = typeof investmentsTable.$inferSelect;
export type NewInvestment = typeof investmentsTable.$inferInsert;
export type ExitDetails = typeof exitDetailsTable.$inferSelect;
export type NewExitDetails = typeof exitDetailsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  investments: investmentsTable, 
  exitDetails: exitDetailsTable 
};