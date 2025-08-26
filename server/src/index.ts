import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createInvestmentInputSchema,
  updateInvestmentInputSchema,
  getInvestmentByIdInputSchema,
  deleteInvestmentInputSchema,
  createExitDetailsInputSchema,
  updateExitDetailsInputSchema,
  getExitDetailsByInvestmentIdInputSchema,
  deleteExitDetailsInputSchema
} from './schema';

// Import handlers
import { createInvestment } from './handlers/create_investment';
import { getInvestments } from './handlers/get_investments';
import { getInvestmentById } from './handlers/get_investment_by_id';
import { updateInvestment } from './handlers/update_investment';
import { deleteInvestment } from './handlers/delete_investment';
import { createExitDetails } from './handlers/create_exit_details';
import { getExitDetailsByInvestmentId } from './handlers/get_exit_details_by_investment_id';
import { updateExitDetails } from './handlers/update_exit_details';
import { deleteExitDetails } from './handlers/delete_exit_details';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Investment routes
  createInvestment: publicProcedure
    .input(createInvestmentInputSchema)
    .mutation(({ input }) => createInvestment(input)),
    
  getInvestments: publicProcedure
    .query(() => getInvestments()),
    
  getInvestmentById: publicProcedure
    .input(getInvestmentByIdInputSchema)
    .query(({ input }) => getInvestmentById(input)),
    
  updateInvestment: publicProcedure
    .input(updateInvestmentInputSchema)
    .mutation(({ input }) => updateInvestment(input)),
    
  deleteInvestment: publicProcedure
    .input(deleteInvestmentInputSchema)
    .mutation(({ input }) => deleteInvestment(input)),

  // Exit details routes
  createExitDetails: publicProcedure
    .input(createExitDetailsInputSchema)
    .mutation(({ input }) => createExitDetails(input)),
    
  getExitDetailsByInvestmentId: publicProcedure
    .input(getExitDetailsByInvestmentIdInputSchema)
    .query(({ input }) => getExitDetailsByInvestmentId(input)),
    
  updateExitDetails: publicProcedure
    .input(updateExitDetailsInputSchema)
    .mutation(({ input }) => updateExitDetails(input)),
    
  deleteExitDetails: publicProcedure
    .input(deleteExitDetailsInputSchema)
    .mutation(({ input }) => deleteExitDetails(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`VC Fund Investment Tracker TRPC server listening at port: ${port}`);
}

start();