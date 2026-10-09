import { format } from "date-fns";

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
}
