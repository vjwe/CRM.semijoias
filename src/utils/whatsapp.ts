/**
 * Robust WhatsApp Integration Utilities (1-Click, Free, No API required)
 */

export type WhatsAppMode = "web" | "app" | "auto";

/**
 * Detects if the user is running on a mobile device
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Formats a phone number for the WhatsApp API/deep-link
 * - Removes all non-digit characters
 * - Prepends Brazil's country code (55) if it matches a standard 10 or 11 digit DDD+Number format
 */
export const formatWhatsAppPhone = (phone: string): string => {
  let clean = phone.replace(/\D/g, "");
  if (!clean) return "";

  // If it's a Brazilian number of 10 or 11 digits, prepend country code (55)
  if (clean.length === 11 || clean.length === 10) {
    clean = "55" + clean;
  }
  return clean;
};

/**
 * Generates the optimal WhatsApp URL based on phone, message, and selected mode
 */
export const getWhatsAppUrl = (phone: string, text: string, mode?: WhatsAppMode): string => {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  
  // Default to 'app' as requested (opens WhatsApp app directly on Windows/installed app)
  const selectedMode = mode || "app";
  
  if (selectedMode === "app") {
    return `whatsapp://send?phone=${formattedPhone}&text=${encodedText}`;
  } else if (selectedMode === "web") {
    return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  } else {
    // Standard compatible redirect
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  }
};

/**
 * Helper to get the human-readable label for a WhatsApp mode
 */
export const getWhatsAppModeLabel = (mode: WhatsAppMode): string => {
  switch (mode) {
    case "web": return "WhatsApp Web";
    case "app": return "WhatsApp App";
    default: return "Auto (API Link)";
  }
};
