function checkPermission(user, requiredRole) {
  if (user.role === 'ADMIN') return true;
  return user.role === requiredRole;
}

module.exports = { checkPermission };
