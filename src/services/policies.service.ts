import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  policiesListResponseSchema,
  policySchema,
  policySummarySchema,
  type CreatePolicyRequest,
  type PoliciesListResponse,
  type Policy,
  type PolicySummary,
} from '@/lib/validators/policies';
import type { PolicyStatusFilter } from '@/types/policies';

export type PolicyReportDownload = {
  blob: Blob;
  filename: string;
  contentType: string;
};

type ListPoliciesParams = {
  statusFilter?: PolicyStatusFilter | null;
  signal?: AbortSignal;
};

function parseOrThrow<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
  context: string,
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error(`[Zod] Validation failed in ${context}:`, error);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

function filenameFromContentDisposition(header: string | undefined, policyId: string) {
  if (!header) return fallbackReportFilename(policyId);

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return sanitizeFilename(decodeURIComponent(utf8Match[1]));

  const asciiMatch = header.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) return sanitizeFilename(asciiMatch[1]);

  return fallbackReportFilename(policyId);
}

function sanitizeFilename(filename: string) {
  const sanitized = filename.replace(/[\\/]/g, '-').trim();
  return sanitized || 'gigsecure-policy-report.pdf';
}

function fallbackReportFilename(policyId: string) {
  return `gigsecure-policy-${policyId}-report.pdf`;
}

function getBlobContentType(blob: Blob, header: string | undefined) {
  return blob.type || header || 'application/octet-stream';
}

async function readBinaryErrorBody(data: unknown) {
  if (data instanceof Blob) return data.text();
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(data);
  }
  return null;
}

async function normalizeBinaryError(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: { data?: unknown } }).response?.data
  ) {
    const response = (error as { response: { data: unknown } }).response;
    const text = await readBinaryErrorBody(response.data);
    if (text === null) return error;

    try {
      return {
        ...(error as object),
        response: {
          ...response,
          data: JSON.parse(text) as unknown,
        },
      };
    } catch {
      return {
        ...(error as object),
        response: {
          ...response,
          data: text,
        },
      };
    }
  }

  return error;
}

export const policiesService = {
  async getSummary(signal?: AbortSignal): Promise<PolicySummary> {
    const { data } = await apiClient.get(ENDPOINTS.POLICIES.SUMMARY, { signal });
    return parseOrThrow(policySummarySchema, data, 'policiesService.getSummary');
  },

  async listPolicies({
    statusFilter,
    signal,
  }: ListPoliciesParams = {}): Promise<PoliciesListResponse> {
    const { data } = await apiClient.get(ENDPOINTS.POLICIES.LIST, {
      params: statusFilter ? { status_filter: statusFilter } : undefined,
      signal,
    });
    return parseOrThrow(policiesListResponseSchema, data, 'policiesService.listPolicies');
  },

  async getPolicy(id: string, signal?: AbortSignal): Promise<Policy> {
    const { data } = await apiClient.get(ENDPOINTS.POLICIES.DETAIL(id), { signal });
    return parseOrThrow(policySchema, data, 'policiesService.getPolicy');
  },

  async createPolicy(payload: CreatePolicyRequest, signal?: AbortSignal): Promise<Policy> {
    const { data } = await apiClient.post(ENDPOINTS.POLICIES.CREATE, payload, { signal });
    return parseOrThrow(policySchema, data, 'policiesService.createPolicy');
  },

  async downloadPolicyReport(id: string, signal?: AbortSignal): Promise<PolicyReportDownload> {
    try {
      const response = await apiClient.get<ArrayBuffer>(ENDPOINTS.POLICIES.REPORT(id), {
        responseType: 'arraybuffer',
        signal,
      });
      const headerContentType = response.headers['content-type'];
      const blob = new Blob([response.data], {
        type: headerContentType || 'application/octet-stream',
      });
      const contentType = getBlobContentType(blob, headerContentType);

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error('Policy report is not available for download yet.');
      }

      if (!contentType.toLowerCase().includes('application/pdf')) {
        throw new Error('Policy report download format is not available yet.');
      }

      return {
        blob,
        contentType,
        filename: filenameFromContentDisposition(response.headers['content-disposition'], id),
      };
    } catch (error) {
      throw await normalizeBinaryError(error);
    }
  },
};
