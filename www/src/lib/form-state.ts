/**
 * Shared shapes for `useActionState`. These live outside the "use server"
 * modules because those files may only export async functions.
 */
import type { FieldErrors } from "@/lib/validation";

export type FormState = { error?: string; notice?: string };

export const emptyFormState: FormState = {};

export type InquiryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const initialInquiryState: InquiryFormState = { status: "idle" };
