-- Core DiskDiff Reader workflow tables
-- Required private storage bucket for plate uploads: plate-images

create table if not exists public.plate_records (
  id uuid primary key default gen_random_uuid(),
  accession_number text not null,
  patient_identifier text,
  specimen_type text not null,
  organism_name text,
  organism_group text,
  plate_size_mm integer not null check (plate_size_mm in (90, 150)),
  medium_type text not null,
  incubation_temperature text,
  incubation_atmosphere text,
  incubation_duration_hours numeric,
  inoculum_standard text,
  operator_id uuid,
  plate_status text not null default 'Draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.plate_images (
  id uuid primary key default gen_random_uuid(),
  plate_record_id uuid references public.plate_records(id) on delete cascade,
  image_url text not null,
  image_type text default 'plate_image',
  capture_device text,
  image_quality_score numeric,
  calibration_method text,
  pixel_per_mm numeric,
  plate_detection_confidence numeric,
  uploaded_by uuid,
  created_at timestamptz default now()
);
create table if not exists public.plate_qc_checks (
  id uuid primary key default gen_random_uuid(), plate_record_id uuid references public.plate_records(id) on delete cascade,
  entire_plate_visible boolean not null default false,image_not_blurred boolean not null default false,lighting_acceptable boolean not null default false,
  no_major_reflection boolean not null default false,agar_surface_intact boolean not null default false,no_excess_moisture boolean not null default false,
  no_obvious_contamination boolean not null default false,lawn_acceptable boolean not null default false,disks_visible boolean not null default false,
  disks_not_displaced boolean not null default false,zones_not_excessively_overlapping boolean not null default false,correct_medium_selected boolean not null default false,
  incubation_condition_entered boolean not null default false,qc_status text not null,qc_comment text,checked_by uuid,created_at timestamptz default now()
);
create table if not exists public.disk_measurements (
  id uuid primary key default gen_random_uuid(), plate_record_id uuid references public.plate_records(id) on delete cascade,
  disk_position text, antimicrobial_name text not null, disk_content text not null, zone_diameter_mm numeric not null,
  measurement_confidence text, measurement_method text not null default 'Manual ruler', manual_adjusted boolean not null default false,
  manual_adjustment_reason text, measured_by uuid, created_at timestamptz default now()
);
create table if not exists public.eucast_breakpoints (
  id uuid primary key default gen_random_uuid(), eucast_version text not null, valid_from date, organism_group text, organism_name text,
  antimicrobial_name text not null, disk_content text not null, s_breakpoint_mm numeric, r_breakpoint_mm numeric, atu_range text,
  notes text, active_status boolean not null default true, created_at timestamptz default now()
);
create table if not exists public.interpretations (
  id uuid primary key default gen_random_uuid(), plate_record_id uuid references public.plate_records(id) on delete cascade,
  disk_measurement_id uuid references public.disk_measurements(id) on delete cascade, antimicrobial_name text not null, disk_content text not null,
  zone_diameter_mm numeric not null, interpretation text not null, eucast_version text, interpretation_notes text, atu_flag boolean not null default false,
  exception_flag boolean not null default false, interpreted_by uuid, created_at timestamptz default now()
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(), plate_record_id uuid references public.plate_records(id) on delete cascade,
  report_status text not null default 'Draft', draft_report_text text, authorised_report_text text, reviewed_by uuid, authorised_by uuid,
  reviewed_at timestamptz, authorised_at timestamptz, rejection_reason text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid, action_type text not null, table_name text not null, record_id uuid,
  old_value jsonb, new_value jsonb, reason text, created_at timestamptz default now()
);

alter table public.plate_records enable row level security;
alter table public.plate_images enable row level security;
alter table public.plate_qc_checks enable row level security;
alter table public.disk_measurements enable row level security;
alter table public.eucast_breakpoints enable row level security;
alter table public.interpretations enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

-- Conservative role-name based policies. TODO: align with production auth claim helpers.
create policy if not exists admin_all_plate_records on public.plate_records for all using (auth.jwt() ->> 'role' = 'Admin') with check (auth.jwt() ->> 'role' = 'Admin');
create policy if not exists admin_all_plate_images on public.plate_images for all using (auth.jwt() ->> 'role' = 'Admin') with check (auth.jwt() ->> 'role' = 'Admin');
create policy if not exists admin_all_plate_qc_checks on public.plate_qc_checks for all using (auth.jwt() ->> 'role' = 'Admin') with check (auth.jwt() ->> 'role' = 'Admin');
create policy if not exists admin_all_disk_measurements on public.disk_measurements for all using (auth.jwt() ->> 'role' = 'Admin') with check (auth.jwt() ->> 'role' = 'Admin');
create policy if not exists admin_all_eucast_breakpoints on public.eucast_breakpoints for all using (auth.jwt() ->> 'role' = 'Admin') with check (auth.jwt() ->> 'role' = 'Admin');
create policy if not exists admin_all_interpretations on public.interpretations for all using (auth.jwt() ->> 'role' = 'Admin') with check (auth.jwt() ->> 'role' = 'Admin');
create policy if not exists admin_all_reports on public.reports for all using (auth.jwt() ->> 'role' = 'Admin') with check (auth.jwt() ->> 'role' = 'Admin');
create policy if not exists admin_all_audit_logs on public.audit_logs for all using (auth.jwt() ->> 'role' = 'Admin') with check (auth.jwt() ->> 'role' = 'Admin');

create policy if not exists consultant_read_all on public.plate_records for select using (auth.jwt() ->> 'role' = 'Consultant Microbiologist');
create policy if not exists consultant_read_images on public.plate_images for select using (auth.jwt() ->> 'role' = 'Consultant Microbiologist');
create policy if not exists consultant_read_qc on public.plate_qc_checks for select using (auth.jwt() ->> 'role' = 'Consultant Microbiologist');
create policy if not exists consultant_read_measurements on public.disk_measurements for select using (auth.jwt() ->> 'role' = 'Consultant Microbiologist');
create policy if not exists consultant_update_interpretations on public.interpretations for update using (auth.jwt() ->> 'role' = 'Consultant Microbiologist');
create policy if not exists consultant_update_reports on public.reports for update using (auth.jwt() ->> 'role' = 'Consultant Microbiologist');

create policy if not exists mls_manage_plate_records on public.plate_records for all using (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist') with check (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist');
create policy if not exists mls_manage_plate_images on public.plate_images for all using (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist') with check (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist');
create policy if not exists mls_manage_plate_qc on public.plate_qc_checks for all using (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist') with check (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist');
create policy if not exists mls_manage_measurements on public.disk_measurements for all using (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist') with check (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist');
create policy if not exists mls_manage_draft_reports on public.reports for all using (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist' and report_status in ('Draft','Pending Review')) with check (auth.jwt() ->> 'role' = 'Medical Laboratory Scientist' and report_status in ('Draft','Pending Review'));

create policy if not exists qo_read_qc on public.plate_qc_checks for select using (auth.jwt() ->> 'role' = 'Quality Officer');
create policy if not exists qo_read_interpretations on public.interpretations for select using (auth.jwt() ->> 'role' = 'Quality Officer');
create policy if not exists qo_read_audit on public.audit_logs for select using (auth.jwt() ->> 'role' = 'Quality Officer');

create policy if not exists viewer_read_authorised_reports on public.reports for select using (auth.jwt() ->> 'role' = 'Viewer' and report_status = 'Authorised');
