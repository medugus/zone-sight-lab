export const mockReports = [
  { id: "R-1042", sample: "S-2026-0455", organism: "E. coli", status: "Pending Review", updated: "2026-05-04" },
  { id: "R-1041", sample: "S-2026-0454", organism: "S. aureus", status: "Draft", updated: "2026-05-04" },
  { id: "R-1040", sample: "S-2026-0453", organism: "K. pneumoniae", status: "Authorised", updated: "2026-05-03" },
  { id: "R-1039", sample: "S-2026-0452", organism: "P. aeruginosa", status: "Draft", updated: "2026-05-03" },
];

export const mockAudit = [
  { ts: "2026-05-05 09:14", user: "m.scientist", role: "MLS", action: "Created plate", entity: "P-2031" },
  { ts: "2026-05-05 08:52", user: "q.officer", role: "QO", action: "Logged QC strain", entity: "ATCC 25922" },
  { ts: "2026-05-04 17:30", user: "c.micro", role: "Consultant", action: "Authorised report", entity: "R-1040" },
  { ts: "2026-05-04 16:11", user: "admin", role: "Admin", action: "Updated breakpoints", entity: "EUCAST v14" },
];

export const qcStrains = [
  { id: "ATCC 25922", organism: "E. coli", purpose: "Gram-negative QC" },
  { id: "ATCC 25923", organism: "S. aureus", purpose: "Gram-positive QC" },
  { id: "ATCC 27853", organism: "P. aeruginosa", purpose: "Pseudomonas QC" },
];

export const mockUsers = [
  { username: "admin", role: "Admin" },
  { username: "c.micro", role: "Consultant Microbiologist" },
  { username: "m.scientist", role: "Medical Laboratory Scientist" },
  { username: "q.officer", role: "Quality Officer" },
  { username: "viewer", role: "Viewer" },
];