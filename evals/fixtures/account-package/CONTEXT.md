# Published account package
`src/index.mjs` is the sole supported public entry point of a published package. External consumers are not all present in this checkout. The 2.x compatibility policy promises the `getAccount(id)` export and its null-on-missing behavior. `consumer.mjs` is one existing customer integration. Run `node --test contract.test.mjs`.
