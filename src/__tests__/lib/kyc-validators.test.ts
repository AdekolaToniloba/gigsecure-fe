import { describe, expect, it } from 'vitest';
import {
  kycStatusResponseSchema,
  kycVerifyRequestSchema,
  kycVerifyResponseSchema,
} from '@/lib/validators/kyc';

describe('KYC validators', () => {
  it('parses a valid NIN verification request', () => {
    const result = kycVerifyRequestSchema.parse({
      document_type: 'NIN',
      document_number: '12345678901',
      first_name: 'Amaka',
      last_name: 'Obi',
      date_of_birth: '1995-06-15',
    });

    expect(result.document_type).toBe('NIN');
    expect(result.document_number).toBe('12345678901');
  });

  it('rejects non-NIN document type values', () => {
    const result = kycVerifyRequestSchema.safeParse({
      document_type: 'INVALID_DOCUMENT',
      document_number: '12345678901',
      first_name: 'Amaka',
      last_name: 'Obi',
      date_of_birth: '1995-06-15',
    });

    expect(result.success).toBe(false);
  });

  it('rejects document numbers that are not exactly 11 digits', () => {
    expect(
      kycVerifyRequestSchema.safeParse({
        document_type: 'NIN',
        document_number: '1234567890',
        first_name: 'Amaka',
        last_name: 'Obi',
        date_of_birth: '1995-06-15',
      }).success
    ).toBe(false);

    expect(
      kycVerifyRequestSchema.safeParse({
        document_type: 'NIN',
        document_number: '1234567890A',
        first_name: 'Amaka',
        last_name: 'Obi',
        date_of_birth: '1995-06-15',
      }).success
    ).toBe(false);
  });

  it.each(['verified', 'rejected', 'failed'] as const)(
    'parses %s verification responses',
    (status) => {
      const result = kycVerifyResponseSchema.parse({
        status,
        message: 'Verification response message.',
        smile_job_id: null,
      });

      expect(result.status).toBe(status);
      expect(result.smile_job_id).toBeNull();
    }
  );

  it.each([null, 'pending', 'verified', 'rejected', 'failed'] as const)(
    'parses %s KYC status responses',
    (status) => {
      const result = kycStatusResponseSchema.parse({
        status,
        document_type: status === null ? null : 'NIN',
        verified_at: status === 'verified' ? '2026-04-24T10:00:00Z' : null,
        rejection_reason: status === 'rejected' ? 'Submitted details did not match records.' : null,
      });

      expect(result.status).toBe(status);
    }
  );
});
