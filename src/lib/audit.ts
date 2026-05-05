export function logAuditEvent(input: {
  action_type: string;
  table_name: string;
  record_id: string;
  old_value?: unknown;
  new_value?: unknown;
  reason?: string;
}) {
  console.info("[audit-placeholder]", input);
}
