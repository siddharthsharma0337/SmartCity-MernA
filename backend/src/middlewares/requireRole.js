// requireRole.js — authMiddleware.js only exports `authenticate` (identity),
// not role gating, so this fills that gap. Runs AFTER authenticate, since
// it depends on req.user.role being set.
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — insufficient role' });
    }
    next();
  };
};
