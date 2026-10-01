import { getAccount } from './src/index.mjs';
export const greeting = (id) => `Hello, ${getAccount(id)?.name ?? 'guest'}`;
