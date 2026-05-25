import type {
  ApiFieldErrors,
  ApiValidationDetail,
  ParsedApiError,
} from '@/types/api';

type ErrorBody = {
  detail?: unknown;
  message?: unknown;
  error?: unknown;
  errors?: unknown;
};

type ResponseLikeError = {
  response?: {
    status?: unknown;
    data?: unknown;
  };
  status?: unknown;
  statusCode?: unknown;
  data?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidationDetail(value: unknown): value is ApiValidationDetail {
  return (
    isRecord(value) &&
    Array.isArray(value.loc) &&
    typeof value.msg === 'string' &&
    typeof value.type === 'string'
  );
}

function toStatusCode(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function getResponseLike(error: unknown): {
  body: unknown;
  statusCode?: number;
} {
  if (!isRecord(error)) return { body: error };

  const responseLike = error as ResponseLikeError;
  if (isRecord(responseLike.response)) {
    return {
      body: responseLike.response.data,
      statusCode: toStatusCode(responseLike.response.status),
    };
  }

  return {
    body: responseLike.data ?? error,
    statusCode: toStatusCode(responseLike.statusCode) ?? toStatusCode(responseLike.status),
  };
}

function normalizeFieldPath(loc: Array<string | number>): string {
  const path = loc[0] === 'body' ? loc.slice(1) : loc;
  return path.map(String).join('.') || 'root';
}

export function mapValidationDetailsToFieldErrors(
  details: ApiValidationDetail[]
): ApiFieldErrors {
  return details.reduce<ApiFieldErrors>((fieldErrors, detail) => {
    const field = normalizeFieldPath(detail.loc);
    fieldErrors[field] = [...(fieldErrors[field] ?? []), detail.msg];
    return fieldErrors;
  }, {});
}

function normalizeErrors(value: unknown): ApiFieldErrors {
  if (!isRecord(value)) return {};

  return Object.entries(value).reduce<ApiFieldErrors>((fieldErrors, [field, messages]) => {
    if (Array.isArray(messages)) {
      const stringMessages = messages.filter((message): message is string => typeof message === 'string');
      if (stringMessages.length > 0) fieldErrors[field] = stringMessages;
      return fieldErrors;
    }

    if (typeof messages === 'string') fieldErrors[field] = [messages];
    return fieldErrors;
  }, {});
}

function messageFromBody(body: ErrorBody, details: ApiValidationDetail[]): string {
  if (typeof body.detail === 'string') return body.detail;
  if (typeof body.message === 'string') return body.message;
  if (typeof body.error === 'string') return body.error;
  if (details.length > 0) return details[0].msg;
  return 'Something went wrong. Please try again.';
}

export function parseApiError(error: unknown): ParsedApiError {
  const { body, statusCode } = getResponseLike(error);

  if (error instanceof Error && !isRecord(body)) {
    return {
      message: error.message,
      statusCode,
      fieldErrors: {},
      raw: error,
    };
  }

  if (!isRecord(body)) {
    return {
      message: typeof body === 'string' ? body : 'Something went wrong. Please try again.',
      statusCode,
      fieldErrors: {},
      raw: error,
    };
  }

  const errorBody = body as ErrorBody;
  const details = Array.isArray(errorBody.detail)
    ? errorBody.detail.filter(isValidationDetail)
    : [];

  const detailFieldErrors = mapValidationDetailsToFieldErrors(details);
  const explicitFieldErrors = normalizeErrors(errorBody.errors);

  return {
    message: messageFromBody(errorBody, details),
    statusCode,
    fieldErrors: {
      ...detailFieldErrors,
      ...explicitFieldErrors,
    },
    details: details.length > 0 ? details : undefined,
    raw: error,
  };
}
