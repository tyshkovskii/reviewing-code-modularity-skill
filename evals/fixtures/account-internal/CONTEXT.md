# Account lookup
This application is deployed as one private process. `src/http.mjs` is the only consumer of `getAccount`. No modules in this directory are published, reflected over, decorated, or used as plugin registrations. This fixture represents the complete relevant application. Run `node --test contract.test.mjs`.
