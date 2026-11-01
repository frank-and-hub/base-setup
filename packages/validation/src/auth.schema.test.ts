import { loginSchema, registerSchema } from './auth.schema';

describe('Auth Validation Schemas', () => {
  it('should validate valid login credentials', () => {
    const valid = { email: 'user@example.com', password: 'Password123!' };
    const result = loginSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const invalid = { email: 'not-an-email', password: 'Password123!' };
    const result = loginSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should require minimum password complexity for registration', () => {
    const weakPass = {
      email: 'user@example.com',
      password: 'password', // Missing uppercase and number
      firstName: 'John',
      lastName: 'Doe',
    };
    const result = registerSchema.safeParse(weakPass);
    expect(result.success).toBe(false);
  });
});

