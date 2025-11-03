export function validateEmail(email: string): boolean {
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return re.test(email);
}

export function validateUsername(username: string): boolean {
  // Minimum 3 chars, alphanumeric + underscore
  const re = /^[a-zA-Z0-9_]{3,}$/;
  return re.test(username);
}

export function validatePassword(password: string): boolean {
  // Minimum 8 chars, upper. lower, number, symbol
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
  return re.test(password);
}