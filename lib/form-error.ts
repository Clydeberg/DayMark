export class FormSubmissionError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "FormSubmissionError";
    this.fieldErrors = fieldErrors;
  }
}
