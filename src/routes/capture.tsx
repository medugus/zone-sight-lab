import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrUpdatePlateRecord } from "@/lib/diskdiff-store";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/capture")({
  component: CapturePage,
});

function CapturePage() {
  const [file, setFile] = useState<File | null>(null);
  const [saved, setSaved] = useState("");
  const [form, setForm] = useState({
    accessionNumber: "",
    patientIdentifier: "",
    specimenType: "",
    organismName: "",
    organismGroup: "",
    plateSizeMm: "90",
    mediumType: "",
    incubationTemperature: "",
    incubationAtmosphere: "",
    incubationDurationHours: "",
    inoculumStandard: "",
    imageUrl: "",
    captureDevice: "",
  });

  return (
    <div>
      <PageHeader
        title="Plate Capture"
        description="Create a draft plate record and attach image metadata."
      />
      <div className="grid gap-4 p-6">
        <Alert>
          <AlertDescription>
            Image-assisted disk diffusion reading is for supervised laboratory use.
            Final AST interpretation requires authorised review.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plate image metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/40 hover:bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="mt-2 text-sm text-muted-foreground">
                  {file ? file.name : "Click to select plate image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <Field label="Image URL placeholder">
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </Field>

              <Field label="Capture device">
                <Input
                  value={form.captureDevice}
                  onChange={(e) =>
                    setForm({ ...form, captureDevice: e.target.value })
                  }
                  placeholder="Phone camera"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plate record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  "accessionNumber",
                  "patientIdentifier",
                  "specimenType",
                  "organismName",
                  "organismGroup",
                  "mediumType",
                  "incubationTemperature",
                  "incubationAtmosphere",
                  "incubationDurationHours",
                  "inoculumStandard",
                ] as const
              ).map((key) => (
                <Field
                  key={key}
                  label={key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (c) => c.toUpperCase())}
                >
                  <Input
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </Field>
              ))}

              <Field label="Plate size">
                <Select
                  value={form.plateSizeMm}
                  onValueChange={(value) =>
                    setForm({ ...form, plateSizeMm: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90 mm</SelectItem>
                    <SelectItem value="150">150 mm</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Button
                onClick={() => {
                  const plate = createOrUpdatePlateRecord({
                    ...form,
                    plateSizeMm: Number(form.plateSizeMm) as 90 | 150,
                  });
                  setSaved(`Saved draft plate ${plate.id}`);
                }}
              >
                Save draft plate record
              </Button>

              {saved && <p className="text-xs text-muted-foreground">{saved}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
