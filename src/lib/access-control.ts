import { ALL_ROLES, ROLES, type Role } from "@/lib/roles";

export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/": ALL_ROLES,
  "/dashboard": ALL_ROLES,
  "/capture": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.MEDICAL_LABORATORY_SCIENTIST],
  "/plate-capture": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.MEDICAL_LABORATORY_SCIENTIST],
  "/qc-plate": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.MEDICAL_LABORATORY_SCIENTIST],
  "/plate-qc": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.MEDICAL_LABORATORY_SCIENTIST],
  "/measure": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.MEDICAL_LABORATORY_SCIENTIST],
  "/zone-measurement": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.MEDICAL_LABORATORY_SCIENTIST],
  "/interpret": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST],
  "/eucast": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST],
  "/eucast/import": [ROLES.ADMIN],
  "/qc": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.QUALITY_OFFICER, ROLES.MEDICAL_LABORATORY_SCIENTIST],
  "/qc-strains": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.QUALITY_OFFICER, ROLES.MEDICAL_LABORATORY_SCIENTIST],
  "/reports": ALL_ROLES,
  "/reports/authorise": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST],
  "/validation": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.QUALITY_OFFICER],
  "/audit": [ROLES.ADMIN, ROLES.CONSULTANT_MICROBIOLOGIST, ROLES.QUALITY_OFFICER],
  "/settings": [ROLES.ADMIN],
};

function normalize(path: string) {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function matches(pattern: string, path: string) {
  if (pattern === "/") return path === "/";
  return path === pattern || path.startsWith(`${pattern}/`);
}

export function canAccessRoute(role: Role, path: string) {
  const normalized = normalize(path);
  const best = Object.keys(ROUTE_PERMISSIONS)
    .filter((pattern) => matches(pattern, normalized))
    .sort((a, b) => b.length - a.length)[0];
  if (!best) return false;
  return ROUTE_PERMISSIONS[best].includes(role);
}

export function canAuthoriseFinalReport(role: Role) {
  return role === ROLES.ADMIN || role === ROLES.CONSULTANT_MICROBIOLOGIST;
}
