/**
 * Role-Based Access Control middleware factory.
 * Usage: router.get('/admin', authenticate, authorize('admin'), handler)
 *        router.get('/vendor', authenticate, authorize('vendor', 'admin'), handler)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};
