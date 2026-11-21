/**
 * Shared shapes for `useActionState`. These live outside the "use server"
 * modules because those files may only export async functions.
 */
import type { IntakeRoute } from "@/lib/intake";
import type { FieldErrors } from "@/lib/validation";

export type FormState = { error?: string; notice?: string };

export const emptyFormState: FormState = {};

export type InquiryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
  /** The route the submission came through, so the confirmation can say what happens next. */
  route?: IntakeRoute;
  /** What they typed, returned on an error so nothing has to be typed twice. */
  values?: Record<string, string>;
};

export const initialInquiryState: InquiryFormState = { status: "idle" };
