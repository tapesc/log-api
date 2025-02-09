## Acceptance Criteria
- [ ] A README file describing how to run and use the service.
- [ ] HTTP REST API should be the primary interface to make data requests 
- [ ] The lines returned must be presented with the newest log events first. It is safe to assume that log files will be written with newest events at the end of the file.
- [ ] The REST API should support additional query parameters which include 
  - [ ] The ability to specify a filename within /var/log
  - [ ] The ability to specify the latest N number of log entries to retrieve within the log
  - [ ] The ability to filter results based on basic text/keyword matches 
- [ ] Must not use any pre-built log aggregation systems - this must be custom, purpose-built
   software. 
- [ ] The service should work and be reasonably performant when requesting files of>1GB
- [ ] Minimize the number of external dependencies in the business logic code path (framework things like HTTP servers, etc are okay)

### Bonus Points
- [ ] The ability to issue a REST request to one “primary” server in order to retrieve logs from a list of “secondary” servers. There aren’t any hard requirements for the protocol used between the primary and secondary servers. 
- [ ] A basic UI to demo the API

## Development

### Start project

```bash
pnpm create next-app --example https://github.com/trpc/trpc --example-path examples/next-prisma-starter trpc-prisma-starter
cd trpc-prisma-starter
pnpm
pnpm dx
```

### Commands

```bash
pnpm build      # runs `prisma generate` + `prisma migrate` + `next build`
pnpm db-reset   # resets local db
pnpm dev        # starts next.js
pnpm dx         # starts postgres db + runs migrations + seeds + starts next.js
pnpm test-dev   # runs e2e tests on dev
pnpm test-start # runs e2e + unit tests
pnpm test-unit  # runs normal Vitest unit tests
pnpm test-e2e   # runs e2e tests
```