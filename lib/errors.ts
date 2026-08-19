export class AppError extends Error {
  constructor(
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION",
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export type ActionState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
};

export const initialActionState: ActionState = { error: null };

export function toActionError(error: unknown): ActionState {
  if (isAppError(error)) {
    return { error: error.message };
  }

  console.error(error);
  return { error: "Something went wrong. Please try again." };
}
