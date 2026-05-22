export const getInitials = (name = '') => {
  const trimmed = String(name).trim();
  if (!trimmed) {
    return '?';
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  const token = parts[0];
  if (token.length === 1) {
    return token.toUpperCase();
  }

  const first = token[0] || '';
  const second = token[1] || '';
  return `${first}${second}`.toUpperCase();
};
