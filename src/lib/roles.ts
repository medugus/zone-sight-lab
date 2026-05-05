export const ROLES = {
  ADMIN: "Admin",
  CONSULTANT_MICROBIOLOGIST: "Consultant Microbiologist",
  MEDICAL_LABORATORY_SCIENTIST: "Medical Laboratory Scientist",
  QUALITY_OFFICER: "Quality Officer",
  VIEWER: "Viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.CONSULTANT_MICROBIOLOGIST,
  ROLES.MEDICAL_LABORATORY_SCIENTIST,
  ROLES.QUALITY_OFFICER,
  ROLES.VIEWER,
];
