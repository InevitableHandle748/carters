export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must include an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must include a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must include a number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('Must include a special character (!@#$%^&*...)');
  }

  return { valid: errors.length === 0, errors };
}

export function getPasswordStrength(password: string): { label: string; percent: number; color: string } {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) score++;

  if (score <= 2) return { label: 'Weak', percent: 25, color: '#DC2626' };
  if (score <= 3) return { label: 'Fair', percent: 50, color: '#F59E0B' };
  if (score <= 4) return { label: 'Good', percent: 75, color: '#0067B9' };
  return { label: 'Strong', percent: 100, color: '#00B2A9' };
}
