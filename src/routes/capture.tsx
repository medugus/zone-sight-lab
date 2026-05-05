import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [
      { title: "Plate Capture — DiskDiff Reader" },
      { name: "description", content: "Capture plate images and sample metadata for reading." },
    ],
  }),
  component: CapturePage,
});

function CapturePage() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div>
      <PageHeader title="Plate Capture" description="Upload a phone-camera image of a Kirby-Bauer / EUCAST disk diffusion plate and record sample metadata." />
      <div className="p-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Plate image</CardTitle></CardHeader>
          <CardContent>
            <label className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/40 hover:bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="mt-2 text-sm text-muted-foreground">
                {file ? file.name : "Click to upload plate image"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Sample metadata</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Sample ID"><Input placeholder="S-2026-0456" /></Field>
            <Field label="Organism"><Input placeholder="e.g. E. coli" /></Field>
            <Field label="Plate size">
              <Select defaultValue="90"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 mm</SelectItem>
                  <SelectItem value="150">150 mm</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Medium"><Input placeholder="Mueller-Hinton" /></Field>
            <Field label="Incubation (h)"><Input type="number" placeholder="18" /></Field>
            <Button>Save draft</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}