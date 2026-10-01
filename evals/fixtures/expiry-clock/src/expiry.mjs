export function isExpired(session) { return Date.now() >= session.expiresAt; }
