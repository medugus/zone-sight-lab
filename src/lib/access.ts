import type { Role } from "@/lib/roles";

export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/": ["Admin", "Consultant Microbiologist", "Medical Laboratory Scientist", "Quality Officer", "Viewer"],
  "/dashboard": ["Admin", "Consultant Microbiologist", "Medical Laboratory Scientist", "Quality Officer", "Viewer"],
  "/capture": ["Admin", "Consultant Microbiologist", "Medical Laboratory Scientist"],
  "/plate-capture": ["Admin", "Consultant Microbiologist", "Medical Laboratory Scientist"],
  "/qc-plate": ["Admin", "Consultant Microbiologist", "Medical Laboratory Scientist"],
  "/plate-qc": ["Admin", "Consultant Microbiologist", "Medical Laboratory Scientist"],
  "/measure": ["Admin", "Consultant Microbiologist", "Medical Laboratory Scientist"],
  "/zone-measurement": ["Admin", "Consultant Microbiologist", "Medical Laboratory Scientist"],
  "/interpret": ["Admin", "Consultant Microbiologist"],
  "/eucast": ["Admin", "Consultant Microbiologist"],
  "/eucast/import": ["Admin"],
  "/qc-strains": ["Admin", "Consultant Microbiologist", "Quality Officer", "Medical Laboratory Scientist"],
  "/qc": ["Admin", "Consultant Microbiologist", "Quality Officer", "Medical Laboratory Scientist"],
  "/reports": ["Admin", "Consultant Microbiologist", "Medical Laboratory Scientist", "Quality Officer", "Viewer"],
  "/reports/authorise": ["Admin", "Consultant Microbiologist"],
  "/validation": ["Admin", "Consultant Microbiologist", "Quality Officer"],
  "/audit": ["Admin", "Consultant Microbiologist", "Quality Officer"],
  "/settings": ["Admin"],
};

export const canAuthoriseFinalReport = (role: Role) => role === "Admin" || role === "Consultant Microbiologist";

export function canAccessRoute(role: Role, path: string) {
  const allowed = ROUTE_PERMISSIONS[path];
  return allowed ? allowed.includes(role) : true;
}
