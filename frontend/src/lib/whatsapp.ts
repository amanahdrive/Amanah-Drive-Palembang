import { Linking, Platform } from "react-native";

/** Normalise an Indonesian phone number into international format for wa.me. */
export function normalizePhoneWA(raw: string): string {
  const cleaned = (raw || "").replace(/[^\d]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("0")) return `62${cleaned.slice(1)}`;
  if (cleaned.startsWith("62")) return cleaned;
  if (cleaned.startsWith("8")) return `62${cleaned}`;
  return cleaned;
}

/** Open WhatsApp (or wa.me on web) with a prefilled message. */
export async function openWhatsApp(phone: string, message: string): Promise<void> {
  const normalized = normalizePhoneWA(phone);
  if (!normalized) return;
  const text = encodeURIComponent(message);
  const url = `https://wa.me/${normalized}?text=${text}`;
  try {
    if (Platform.OS === "web") {
      // Open in new tab so the preview page keeps running.
      const w = (globalThis as unknown as { open?: (u: string, t: string) => void }).open;
      if (w) {
        w(url, "_blank");
        return;
      }
    }
    await Linking.openURL(url);
  } catch {
    // ignore — user may not have WhatsApp installed.
  }
}
