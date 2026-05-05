type AuditEventInput = {
  action_type: string;
  table_name: string;
  record_id: string;
  old_value?: unknown;
  new_value?: unknown;
  reason?: string;
};

export async function logAuditEvent({ action_type, table_name, record_id, old_value, new_value, reason }: AuditEventInput) {
  console.info("[audit-placeholder]", { action_type, table_name, record_id, old_value, new_value, reason, ts: new Date().toISOString() });
}
