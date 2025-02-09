/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { logRouter } from '~/server/routers/log.ts';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),

  log: logRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
