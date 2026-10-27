export const ADMIN_VIEWS = ["items", "categories", "leagues"] as const;

export type AdminView = (typeof ADMIN_VIEWS)[number];

export function parseAdminView(
  value: string | string[] | null | undefined,
): AdminView {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "categories" || raw === "leagues" || raw === "items") {
    return raw;
  }
  return "items";
}

export function adminViewHref(view: AdminView) {
  if (view === "items") {
    return "/admin";
  }
  return `/admin?view=${view}`;
}
