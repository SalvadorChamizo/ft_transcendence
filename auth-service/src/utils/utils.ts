export function validateEmail(email: string): boolean {
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return re.test(email);
}

export function validateUsername(username: string): boolean {
  // Minimum 3 chars and Max 12 char
  const re = /^().{3,12}$/;
  return re.test(username);
}

export function validatePassword(password: string): boolean {
  // Minimum 6 chars, Max 12 char, upper. lower, number, special char
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-!@#$%^&*(),.?":{}|<>]).{6,12}$/;
  return re.test(password);
}