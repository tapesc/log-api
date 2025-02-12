import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';
import { DataTable } from 'mantine-datatable';
import { flatten } from 'lodash';
import { Button, Group, NumberInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { showNotification } from '@mantine/notifications';

const IndexPage: NextPageWithLayout = () => {

  // store query params in state so that refetches are triggered when they change in state
  const [queryParams, setQueryParams] = useState({
    limit: 100,
    filename: 'test.log',
    filter: undefined as string | undefined,
  });

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      ...queryParams,
    },
  });

  const logQuery = trpc.log.list.useInfiniteQuery({
      ...queryParams,
    },
    {
      retry: 1,
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    });

  useEffect(() => {
    if (logQuery.error) {
      showNotification({
        message: logQuery.error.message,
        color: 'red',
      });
    }
  }, [logQuery.error]);


  return (
    <Stack>
      <h2 className="text-3xl font-semibold">
        Latest Posts
        {logQuery.status === 'pending' && '(loading)'}
      </h2>

      <form
        onSubmit={form.onSubmit((values) => {
          setQueryParams({ ...values, filter: values.filter === '' ? undefined : values.filter });
        })}
      >
        <Group align="flex-end">
          <TextInput
            label="Filename"
            key={form.key('filename')}
            {...form.getInputProps('filename')}
          />

          <NumberInput
            label="Page limit"
            key={form.key('limit')}
            {...form.getInputProps('limit')}
          />

          <TextInput
            label="Filter"
            key={form.key('filter')}
            placeholder="Search keywords"
            {...form.getInputProps('filter')}
          />
          <Button type="submit">Search</Button>
        </Group>
      </form>

      <Group>
        <Button
          disabled={!logQuery.hasNextPage || logQuery.isFetchingNextPage}
          onClick={() => logQuery.fetchNextPage()}
        >
          Fetch more logs
        </Button>
      </Group>

      <DataTable
        withTableBorder
        minHeight={180}
        height={600}
        fetching={logQuery.isPending}
        columns={[{ accessor: 'timestamp' }, { accessor: 'host' }, { accessor: 'processName' }, { accessor: 'pid' }, { accessor: 'message' }, { accessor: 'rawLine' }]}
        records={logQuery.data ? flatten(logQuery.data.pages.map((page) => page.lines)) : []}
        rowBackgroundColor={({ isParsed }) => {
          if (isParsed === false) return 'red.1';
        }}
      />


    </Stack>
  );
};

export default IndexPage;

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @see https://trpc.io/docs/v11/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createServerSideHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.post.all.fetch();
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
