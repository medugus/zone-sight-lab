type AuditEventInput = {
  action_type: string;
  table_name: string;
  record_id: string;
  old_value?: unknown;
  new_value?: unknown;
  reason?: string;
};

export async function logAuditEvent({ action_type, table_name, record_id, old_value, new_value, reason }: AuditEventInput): Promise<void> {
  // Placeholder for future Supabase-backed audit persistence.
  console.info("[audit-event]", { action_type, table_name, record_id, old_value, new_value, reason, at: new Date().toISOString() });
}
