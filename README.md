## Acceptance Criteria
- [x] A README file describing how to run and use the service.
- [x] HTTP REST API should be the primary interface to make data requests 
- [x] The lines returned must be presented with the newest log events first. It is safe to assume that log files will be written with newest events at the end of the file.
- [x] The REST API should support additional query parameters which include 
  - [x] The ability to specify a filename within /var/log
  - [x] The ability to specify the latest N number of log entries to retrieve within the log
  - [x] The ability to filter results based on basic text/keyword matches 
- [x] Must not use any pre-built log aggregation systems - this must be custom, purpose-built
   software. 
- [x] The service should work and be reasonably performant when requesting files of>1GB
- [x] Minimize the number of external dependencies in the business logic code path (framework things like HTTP servers, etc are okay)

### Bonus Points
- [ ] The ability to issue a REST request to one “primary” server in order to retrieve logs from a list of “secondary” servers. There aren’t any hard requirements for the protocol used between the primary and secondary servers. 
- [x] A basic UI to demo the API

## Development

### Prerequisites
- Node.js
- pnpm

### Start project

```bash
pnpm dev
```

### Using the service
1. Open your browser and navigate to `http://localhost:3000`
2. You will see a simple UI to interact with the service
3. The service will return the logs from [test.log](test.log) at the root of this directory. You can also test with your own log files by placing them in the root directory and specifying the filename in the input field.

## Comments

### Assumptions
* I made an assumption that the log files would follow the syntax defined in [RFC 5424](https://datatracker.ietf.org/doc/html/rfc5424).
  * Log files with other syntaxes will still be returned, but the metadata will not be parsed correctly. These rows will be highlighted in red
* I assume that log files to test will be in the root of the directory. I made this choice to avoid permissions issues with placing files in the `/var/log` directory.

### Improvements/Comments
* To simplify and streamline delivering an API with Web UI, I used a full stack framework (Next.js). For a service such as this in production, it would be better to decouple the front-end and back-end to allow for scaling independently.
* Add tests. Specifically unit tests for the parser and E2E tests for the UI.
* Add load testing for log files of large sizes to ensure performance. Potentially test with different "chunk" sizes in the parser to see how it affects performance and what chunk size is optimal.
* Add API documentation, preferably using the OpenAPI spec.
* Add the ability to retrieve logs from secondary servers. This could be done using service to service communication using something like gRPC and could be done in parallel.
* Investigate other performance optimizations such as breaking large files into chunks and processing them in parallel.