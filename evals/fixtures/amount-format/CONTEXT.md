# Amount formatting
This private module formats integer cents for a text export. One implementation, one caller, no I/O or mutable state, no planned alternatives, and the ordinary unit tests already call it directly. Inputs are nonnegative integer cents. Run `node --test contract.test.mjs`.
