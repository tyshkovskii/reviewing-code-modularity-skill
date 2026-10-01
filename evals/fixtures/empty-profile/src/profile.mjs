export function profileResponse(user) { return { status: 200, body: { displayName: user.profile.name } }; }
