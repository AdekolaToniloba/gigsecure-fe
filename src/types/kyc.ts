export type KycDocumentType = 'NIN';

export type KycVerifyStatus = 'verified' | 'rejected' | 'failed';

export type KycStatus = null | 'pending' | KycVerifyStatus;

export type KYCVerifyRequest = {
  document_type: KycDocumentType;
  document_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
};

export type KYCVerifyResponse = {
  status: KycVerifyStatus;
  message: string;
  smile_job_id?: string | null;
};

export type KYCStatusResponse = {
  status: KycStatus;
  document_type: KycDocumentType | null;
  verified_at: string | null;
  rejection_reason: string | null;
};
