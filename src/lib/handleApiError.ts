export function handleApiError(error: unknown, notifyError: (msg: string) => void) {
  if (typeof error === "string") {
    notifyError(error);
    return;
  }

  const err = error as {
    errors?: Record<string, string[]> | string[];
    message?: string;
    errorMessage?: string;
  };

  if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
    err.errors.forEach((message) => notifyError(message));
    return;
  }

  if (err?.errors && !Array.isArray(err.errors)) {
    const allErrors = Object.values(err.errors).flat();
    if (allErrors.length > 0) {
      allErrors.forEach((message) => notifyError(message));
      return;
    }
  }

  if (err?.message) {
    notifyError(err.message);
    return;
  }

  if (err?.errorMessage) {
    notifyError(err.errorMessage);
    return;
  }

  notifyError("حدث خطأ غير متوقع");
}
