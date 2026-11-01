export class ApiError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) { super(message); }
}
export const fail = (status: number, code: string, message: string): never => { throw new ApiError(status, code, message); };
