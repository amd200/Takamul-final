export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: string[];

  constructor(message: string, status: number, code?: string, errors?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}
