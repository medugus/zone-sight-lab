import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useRole } from "@/lib/roles";
import { mockReports, mockAudit, qcStrains, mockUsers } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DiskDiff Reader" },
      { name: "description", content: "Role-aware overview of plates, reports, QC, and audit activity." },
    ],
  }),
  component: Index,
});

function Index() {
  const { role } = useRole();
  const pending = mockReports.filter((r) => r.status === "Pending Review");
  const drafts = mockReports.filter((r) => r.status === "Draft");
  const authorised = mockReports.filter((r) => r.status === "Authorised");

  return (
    <div>
      <PageHeader
        title={`Welcome, ${role}`}
        description="DiskDiff Reader assists supervised reading of Kirby-Bauer / EUCAST disk diffusion plates. No report is released without authorisation."
      />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Drafts" value={drafts.length} />
          <Stat label="Pending review" value={pending.length} />
          <Stat label="Authorised (7d)" value={authorised.length} />
          <Stat label="QC strains" value={qcStrains.length} />
        </div>

        {role === "Admin" && (
          <DashGrid>
            <SimpleCard title="Users" description="Mock users in this dev build">
              <ul className="text-sm divide-y">
                {mockUsers.map((u) => (
                  <li key={u.username} className="py-2 flex justify-between">
                    <span className="font-mono">{u.username}</span>
                    <span className="text-muted-foreground">{u.role}</span>
                  </li>
                ))}
              </ul>
            </SimpleCard>
            <RecentAudit />
            <SimpleCard title="System" description="Configuration shortcuts">
              <Button asChild variant="secondary" size="sm"><Link to="/settings">Open settings</Link></Button>
            </SimpleCard>
          </DashGrid>
        )}

        {role === "Consultant Microbiologist" && (
          <DashGrid>
            <SimpleCard title="Awaiting authorisation" description="Reports flagged for consultant sign-off">
              <ReportList items={pending} actionLabel="Review" />
            </SimpleCard>
            <SimpleCard title="Recently authorised" description="Last signed reports">
              <ReportList items={authorised} />
            </SimpleCard>
          </DashGrid>
        )}

        {role === "Medical Laboratory Scientist" && (
          <DashGrid>
            <SimpleCard title="My drafts" description="Plates you are currently working on">
              <ReportList items={drafts} actionLabel="Continue" />
            </SimpleCard>
            <SimpleCard title="Today's QC" description="Daily QC strain status">
              <p className="text-sm text-muted-foreground">No QC runs logged yet today.</p>
              <Button asChild size="sm" className="mt-3"><Link to="/qc-strains">Log QC run</Link></Button>
            </SimpleCard>
            <SimpleCard title="Start a new plate" description="Capture a plate image and metadata">
              <Button asChild size="sm"><Link to="/capture">New plate capture</Link></Button>
            </SimpleCard>
          </DashGrid>
        )}

        {role === "Quality Officer" && (
          <DashGrid>
            <SimpleCard title="QC strain trends" description="Levey-Jennings style charts (placeholder)">
              <div className="h-32 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                Trend chart placeholder
              </div>
            </SimpleCard>
            <SimpleCard title="Out-of-range alerts" description="QC values outside acceptable ranges">
              <p className="text-sm text-muted-foreground">No alerts.</p>
            </SimpleCard>
            <RecentAudit />
          </DashGrid>
        )}

        {role === "Viewer" && (
          <DashGrid>
            <SimpleCard title="Authorised reports" description="Read-only view of released results">
              <ReportList items={authorised} />
            </SimpleCard>
          </DashGrid>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function DashGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function SimpleCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "Authorised") return "default";
  if (status === "Pending Review") return "secondary";
  return "outline";
}

function ReportList({ items, actionLabel }: { items: typeof mockReports; actionLabel?: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nothing here.</p>;
  return (
    <ul className="text-sm divide-y">
      {items.map((r) => (
        <li key={r.id} className="py-2 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-mono text-xs">{r.id} · {r.sample}</span>
            <span className="text-muted-foreground text-xs">{r.organism}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
            {actionLabel && (
              <Button asChild size="sm" variant="outline">
                <Link to="/reports">{actionLabel}</Link>
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function RecentAudit() {
  return (
    <SimpleCard title="Recent audit events" description="Last actions in the system">
      <ul className="text-xs divide-y font-mono">
        {mockAudit.slice(0, 4).map((a, i) => (
          <li key={i} className="py-2 flex justify-between gap-2">
            <span className="text-muted-foreground">{a.ts}</span>
            <span>{a.user}</span>
            <span className="text-foreground">{a.action}</span>
          </li>
        ))}
      </ul>
    </SimpleCard>
  );
}
