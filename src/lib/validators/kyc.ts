import { z } from 'zod';

export const kycDocumentTypeSchema = z.literal('NIN');

export const kycVerifyStatusSchema = z.enum(['verified', 'rejected', 'failed']);

export const kycStatusSchema = z.union([
  z.literal(null),
  z.literal('pending'),
  kycVerifyStatusSchema,
]);

export const kycVerifyRequestSchema = z.object({
  document_type: kycDocumentTypeSchema,
  document_number: z
    .string()
    .regex(/^\d{11}$/, 'Document number must be exactly 11 digits.'),
  first_name: z.string().trim().min(1, 'First name is required.'),
  last_name: z.string().trim().min(1, 'Last name is required.'),
  date_of_birth: z.string().trim().min(1, 'Date of birth is required.'),
});

export const kycVerifyResponseSchema = z.object({
  status: kycVerifyStatusSchema,
  message: z.string().min(1),
  smile_job_id: z.string().nullable().optional(),
});

export const kycStatusResponseSchema = z.object({
  status: kycStatusSchema,
  document_type: kycDocumentTypeSchema.nullable(),
  verified_at: z.string().datetime().nullable(),
  rejection_reason: z.string().nullable(),
});

export type KYCVerifyRequest = z.infer<typeof kycVerifyRequestSchema>;
export type KYCVerifyResponse = z.infer<typeof kycVerifyResponseSchema>;
export type KYCStatusResponse = z.infer<typeof kycStatusResponseSchema>;
