import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { parseSyslogLine, readLines } from '~/utils/file-system.ts';
import { DateTime } from "luxon";

export const logRouter = router({
  list: publicProcedure
    .input(
      z.object({
        filename: z.string().min(1).default('test.log'),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
        filter: z.string().min(1).optional(),
      }),
    )
    .query(async ({ input }) => {
      /**
       * For pagination docs you can have a look here
       * @see https://trpc.io/docs/v11/useInfiniteQuery
       * @see https://www.prisma.io/docs/concepts/components/prisma-client/pagination
       */

      const {  cursor, limit, filter } = input;

      const data = await readLines({
        filePath: `${process.cwd()}/${input.filename}`,
        limit,
        cursor,
        filter,
      });

      return {
        lines: data.lines.map((line) => parseSyslogLine(line)),
        nextCursor: data.nextCursor,
      }
    }),
});
