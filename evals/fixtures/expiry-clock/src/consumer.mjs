import { isExpired } from './expiry.mjs';
export function sessionStatus(session) { return isExpired(session) ? 'expired' : 'active'; }
