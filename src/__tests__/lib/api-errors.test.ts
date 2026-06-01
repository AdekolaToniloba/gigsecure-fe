import { describe, expect, it } from 'vitest';
import {
  mapValidationDetailsToFieldErrors,
  parseApiError,
} from '@/lib/api/errors';

describe('parseApiError', () => {
  it('parses string detail errors', () => {
    expect(parseApiError({ detail: 'Invalid credentials' })).toMatchObject({
      message: 'Invalid credentials',
      fieldErrors: {},
    });
  });

  it('parses message errors', () => {
    expect(parseApiError({ message: 'Reset email sent' })).toMatchObject({
      message: 'Reset email sent',
      fieldErrors: {},
    });
  });

  it('parses Axios-style response errors', () => {
    const result = parseApiError({
      response: {
        status: 401,
        data: { detail: 'Missing or invalid token' },
      },
    });

    expect(result).toMatchObject({
      message: 'Missing or invalid token',
      statusCode: 401,
      fieldErrors: {},
    });
  });

  it('maps 422 detail arrays to field errors', () => {
    const result = parseApiError({
      response: {
        status: 422,
        data: {
          detail: [
            {
              loc: ['body', 'document_number'],
              msg: 'must be exactly 11 digits',
              type: 'value_error',
            },
            {
              loc: ['body', 'profile', 'date_of_birth'],
              msg: 'invalid date',
              type: 'value_error',
            },
          ],
        },
      },
    });

    expect(result.message).toBe('must be exactly 11 digits');
    expect(result.statusCode).toBe(422);
    expect(result.fieldErrors).toEqual({
      document_number: ['must be exactly 11 digits'],
      'profile.date_of_birth': ['invalid date'],
    });
  });

  it('maps explicit errors objects to field errors', () => {
    const result = parseApiError({
      status: 400,
      data: {
        message: 'Validation failed',
        errors: {
          email: ['Email is already registered'],
          password: 'Password is too short',
        },
      },
    });

    expect(result).toMatchObject({
      message: 'Validation failed',
      statusCode: 400,
      fieldErrors: {
        email: ['Email is already registered'],
        password: ['Password is too short'],
      },
    });
  });

  it('parses thrown Error objects', () => {
    expect(parseApiError(new Error('Network failed'))).toMatchObject({
      message: 'Network failed',
      fieldErrors: {},
    });
  });
});

describe('mapValidationDetailsToFieldErrors', () => {
  it('groups multiple validation messages for the same field', () => {
    const result = mapValidationDetailsToFieldErrors([
      {
        loc: ['body', 'password'],
        msg: 'Password is too short',
        type: 'value_error',
      },
      {
        loc: ['body', 'password'],
        msg: 'Password is too common',
        type: 'value_error',
      },
    ]);

    expect(result).toEqual({
      password: ['Password is too short', 'Password is too common'],
    });
  });
});
