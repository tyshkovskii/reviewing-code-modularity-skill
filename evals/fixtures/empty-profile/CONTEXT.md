# Profile route
The reported bug: profileResponse({ profile: null }) throws instead of returning a guest response. Expected guest behavior is status 200 and { displayName: 'Guest' }. Valid profiles must continue to use their name. Keep this bug fix local. Run `node --test contract.test.mjs`. The passing baseline test characterizes the current bug; update that expectation when fixing it.
