/**
 * Submit rental form to Equipter-Sanity frontend API (same as web /rental).
 * POST /api/forms/submit → Sanity formEntry; GET /api/forms/entry/[id] for success location.
 */

import { FORMS_SUBMIT_URL } from "./useEnv";

export type FormField = {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  value: string;
};

export type SubmitRentalPayload = {
  formRef: string;
  formTitle?: string;
  fields: FormField[];
  metadata?: { equipmentId?: string; equipmentName?: string };
};

export type SubmitRentalResult =
  | { success: true; entryId: string }
  | { success: false; error: string; message?: string };

/**
 * POST to Equipter-Sanity frontend /api/forms/submit (same payload as web rental form).
 */
export async function submitRentalForm(
  payload: SubmitRentalPayload
): Promise<SubmitRentalResult> {
  const base = FORMS_SUBMIT_URL.replace(/\/$/, "");
  if (!base) {
    return {
      success: false,
      error: "FORMS_SUBMIT_URL not configured",
      message: "Set EXPO_PUBLIC_FORMS_SUBMIT_URL in .env",
    };
  }

  const body = {
    formId: payload.formRef,
    form: { _type: "reference", _ref: payload.formRef },
    formTitle: payload.formTitle || "Rental Request Form",
    submittedAt: new Date().toISOString(),
    sourceUrl: "mobile-app",
    userAgent: "EquipterRentalApp",
    fields: payload.fields,
    metadata: payload.metadata || {},
  };

  try {
    const res = await fetch(`${base}/api/forms/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Submission failed",
        message: data.message,
      };
    }

    if (data.success && data.entryId) {
      return { success: true, entryId: data.entryId };
    }

    return {
      success: false,
      error: data.error || "Unknown error",
      message: data.message,
    };
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError &&
      (err.message === "Failed to fetch" || err.message === "Network request failed");
    return {
      success: false,
      error: "Network error",
      message: isNetworkError
        ? "Could not reach the server. On a phone or tablet? Use your computer's IP in .env (e.g. EXPO_PUBLIC_FORMS_SUBMIT_URL=http://192.168.1.x:3000) instead of localhost, then restart Expo."
        : (err instanceof Error ? err.message : "Failed to submit. Please try again."),
    };
  }
}

export type EntryLocation = {
  name?: string;
  street?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  formattedPhone?: string;
  distance?: number;
};

export type FetchEntryResult =
  | { success: true; entry: unknown; nearestLocation: EntryLocation | null }
  | { success: false; error: string };

/**
 * GET form entry and nearest rental location (same as web success page).
 */
export async function fetchFormEntry(
  entryId: string
): Promise<FetchEntryResult> {
  const base = FORMS_SUBMIT_URL.replace(/\/$/, "");
  if (!base) {
    return { success: false, error: "FORMS_SUBMIT_URL not configured" };
  }

  const res = await fetch(`${base}/api/forms/entry/${entryId}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    return {
      success: false,
      error: data.error || "Failed to load entry",
    };
  }

  return {
    success: true,
    entry: data.entry,
    nearestLocation: data.nearestLocation ?? null,
  };
}
