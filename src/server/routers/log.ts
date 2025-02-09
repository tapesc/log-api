import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { readLines } from '~/utils/file-system.ts';
import { DateTime } from "luxon";

export const logRouter = router({
  list: publicProcedure
    .input(
      z.object({
        filename: z.string().min(1).default('system.log'),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ input }) => {
      /**
       * For pagination docs you can have a look here
       * @see https://trpc.io/docs/v11/useInfiniteQuery
       * @see https://www.prisma.io/docs/concepts/components/prisma-client/pagination
       */

      const {  cursor, limit } = input;

      const data = await readLines({
        filePath: `/var/log/${input.filename}`,
        limit,
        cursor,
      });

      return {
        lines: data.lines.map((line) => {
          const match = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2})\s(.+)$/.exec(line);
          if (!match) {
            return {
              datetime: undefined,
              content: line
            };
          }

          return {
            datetime: DateTime.fromFormat(
              match[1],
              "yyyy-MM-dd HH:mm:ssZZ"
            ).toISO(),
            content: match[2]
          };
        }),
        nextCursor: data.nextCursor,
      }
    }),
});
