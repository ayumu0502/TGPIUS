"use server";

import { CONTACT_SUCCESS_MESSAGE } from "@/lib/contact/constants";
import { sendContactInquiryEmail } from "@/lib/contact/mail";
import {
  parseContactForm,
  validateContactForm,
  type ContactFormState,
} from "@/lib/contact/validation";

export async function submitContactInquiry(
  _prevState: ContactFormState | null,
  formData: FormData
): Promise<ContactFormState> {
  const input = parseContactForm(formData);

  if (input.honeypot) {
    return { success: CONTACT_SUCCESS_MESSAGE };
  }

  const validationError = validateContactForm(input);
  if (validationError) {
    return validationError;
  }

  const result = await sendContactInquiryEmail({
    companyName: input.companyName,
    contactName: input.contactName,
    email: input.email,
    phone: input.phone,
    inquiryType: input.inquiryType,
    message: input.message,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { success: CONTACT_SUCCESS_MESSAGE };
}
