// ─── API Error ───────────────────────────────────────────────────
export type ApiError = {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
};

// ─── Generic response wrapper ────────────────────────────────────
export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

// ─── Paginated response ──────────────────────────────────────────
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
