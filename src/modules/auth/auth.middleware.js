/**
 * Attach when you have sessions/JWT. Example:
 * export function requireAuth(req, res, next) { ... }
 */
export function optionalAuth(_req, _res, next) {
  next();
}
