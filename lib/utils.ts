/*
 * Utility functions for status labels, tones, and inspection due calculations.
 *
 * This module centralises the logic for translating internal enum values into
 * human friendly Turkish labels and determining visual tones. It also helps
 * compute deadlines based on annual inspection labels. Keeping this logic in
 * one place reduces duplication across pages and makes it easy to update
 * translations consistently.
 */

// Map internal work order statuses to human friendly Turkish labels. If an
// unknown status is encountered it falls back to the raw status to avoid
// hiding information. Extend this function as new statuses are added.
export function statusLabel(status: string): string {
  switch (status) {
    case "DONE":
      return "Tamamlandı";
    case "IN_PROGRESS":
      return "Sahada";
    case "URGENT":
      return "Acil";
    case "CANCELED":
      return "İptal";
    case "PENDING":
      return "Planlı";
    default:
      // Return the raw status for unknown values to avoid hiding information.
      return status;
  }
}

// Determine a colour tone based on a work order status. These tones map to
// design tokens defined in the Tailwind config (e.g. red for urgent, amber for
// in progress, green for done and blue for everything else). Use "neutral"
// for cancelled or unknown statuses.
export function statusTone(status: string): "red" | "amber" | "green" | "blue" | "neutral" {
  switch (status) {
    case "DONE":
      return "green";
    case "IN_PROGRESS":
      return "amber";
    case "URGENT":
      return "red";
    case "CANCELED":
      return "neutral";
    default:
      return "blue";
  }
}

// Given a periodic inspection date and label, compute the deadline by which
// defects must be corrected. The label values correspond to common colour
// codes used in the elevator industry:
//   YESIL/MAVI → 365 days (one year)
//   SARI       → 120 days
//   KIRMIZI    → 60 days
// If the label is not recognised the due date defaults to one year from the
// inspection date. Adjust the durations here if regulations change.
export function inspectionDueDate(inspectionDate: Date, label?: string | null): Date {
  const base = new Date(inspectionDate);
  const l = (label ?? "").toUpperCase();
  let days: number;
  if (l === "YESIL" || l === "MAVI") {
    days = 365;
  } else if (l === "SARI") {
    days = 120;
  } else if (l === "KIRMIZI") {
    days = 60;
  } else {
    // Default to a year if unknown – this avoids negative countdowns.
    days = 365;
  }
  // Add the specified number of days to the inspection date.
  const due = new Date(base.getTime());
  due.setDate(due.getDate() + days);
  return due;
}

// Compute the number of whole days between two dates (rounded up). If the
// difference is negative the result will be zero. Use this to display
// countdowns to deadlines. The order of parameters is (later, earlier).
export function daysBetween(later: Date, earlier: Date): number {
  const diffMs = later.getTime() - earlier.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}