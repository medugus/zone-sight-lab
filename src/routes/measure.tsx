import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImportedWorklistSummaryCard } from "@/components/imported-worklist-summary-card";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addDiskMeasurement,
  deleteDiskMeasurement,
  DuplicateMeasurementError,
  getWorkflowState,
  saveDiscNotMeasuredReason,
  updateDiskMeasurement,
  type DiskMeasurement,
  type NotMeasuredReason,
} from "@/lib/diskdiff-store";

export const Route = createFileRoute("/measure")({ component: MeasurePage });

function MeasurePage() {
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);
  const [pendingDuplicate, setPendingDuplicate] = useState<Omit<DiskMeasurement, "id"> | null>(
    null,
  );
  const workflow = getWorkflowState();
  const plateSize = workflow.currentPlate?.plateSizeMm ?? 90;
  const blocked = workflow.plateQc?.qcStatus === "Reject image or repeat plate";
  const [form, setForm] = useState({
    diskPosition: "",
    antimicrobialName: "",
    diskContent: "",
    zoneDiameterMm: "",
    comment: "",
    antibioticCode: "",
    readerConfidence: "manual",
    measurementSource: "manual_entry",
    reviewStatus: "accepted",
    manualEdited: "false",
    overrideReason: "",
    originalValue: "",
    correctedValue: "",
    reviewedBy: "",
    reviewedAt: "",
  });

  const measurements = getWorkflowState().measurements;
  const measurementPlan = workflow.discLayout.filter((disc) => disc.expectedOnPlate);

  const resetCorrectionForm = () => {
    setEditingMeasurementId(null);
    setPendingDuplicate(null);
    setForm({
      diskPosition: "",
      antimicrobialName: "",
      diskContent: "",
      zoneDiameterMm: "",
      comment: "",
      antibioticCode: "",
      readerConfidence: "manual",
      measurementSource: "manual_entry",
      reviewStatus: "accepted",
      manualEdited: "false",
      overrideReason: "",
      originalValue: "",
      correctedValue: "",
      reviewedBy: "",
      reviewedAt: "",
    });
  };

  const buildMeasurementFromForm = (): Omit<DiskMeasurement, "id"> | null => {
    const zone = Number(form.zoneDiameterMm);
    if (Number.isNaN(zone)) {
      setError("zone diameter must be numeric");
      return null;
    }
    if (zone < 6) {
      setError("zone diameter must be >=6 mm");
      return null;
    }
    if (zone > plateSize) {
      setError("zone diameter must be <= plate size");
      return null;
    }
    const manualEdited = form.manualEdited === "true";
    const originalValue = form.originalValue ? Number(form.originalValue) : null;
    const correctedValue = form.correctedValue ? Number(form.correctedValue) : null;
    if (manualEdited) {
      if (originalValue === null || Number.isNaN(originalValue)) {
        setError("manual edits require numeric originalValue");
        return null;
      }
      if (correctedValue === null || Number.isNaN(correctedValue)) {
        setError("manual edits require numeric correctedValue");
        return null;
      }
      if (!form.overrideReason.trim()) {
        setError("manual edits require overrideReason");
        return null;
      }
      if (!form.reviewedBy.trim()) {
        setError("manual edits require reviewedBy");
        return null;
      }
      if (!form.reviewedAt.trim()) {
        setError("manual edits require reviewedAt");
        return null;
      }
    }

    return {
      diskPosition: form.diskPosition,
      antimicrobialName: form.antimicrobialName,
      diskContent: form.diskContent,
      zoneDiameterMm: zone,
      measurementMethod: "Manual ruler",
      comment: form.comment,
      antibioticCode: form.antibioticCode,
      antibioticName: form.antimicrobialName,
      discPotency: form.diskContent,
      readerConfidence: form.readerConfidence as "high" | "medium" | "low" | "manual",
      measurementSource: form.measurementSource as
        | "auto_reader"
        | "manual_entry"
        | "reader_then_manual"
        | "imported",
      manualEdited,
      originalValue,
      correctedValue,
      overrideReason: form.overrideReason,
      reviewedBy: form.reviewedBy,
      reviewedAt: form.reviewedAt,
      reviewStatus: form.reviewStatus as "pending" | "accepted" | "rejected" | "needs_repeat",
    };
  };

  const saveMeasurement = (replaceExisting = false) => {
    const measurement = pendingDuplicate ?? buildMeasurementFromForm();
    if (!measurement) return;

    try {
      setError("");
      if (editingMeasurementId) {
        updateDiskMeasurement(editingMeasurementId, {
          zoneDiameterMm: measurement.zoneDiameterMm,
          comment: measurement.comment,
          readerConfidence: measurement.readerConfidence,
          reviewStatus: measurement.reviewStatus,
          overrideReason: measurement.overrideReason,
          reviewedBy: measurement.reviewedBy,
          reviewedAt: measurement.reviewedAt,
        });
        setEditingMeasurementId(null);
      } else {
        addDiskMeasurement(measurement, { replaceExisting });
      }
      setPendingDuplicate(null);
      setRefresh((n) => n + 1);
    } catch (caught) {
      if (caught instanceof DuplicateMeasurementError) {
        setPendingDuplicate(measurement);
        setError(
          `Measurement already exists for ${measurement.diskPosition} + ${measurement.antibioticCode}. Replace existing entry or cancel.`,
        );
        return;
      }
      throw caught;
    }
  };

  return (
    <div>
      <PageHeader title="Zone Measurement" description="Manual zone entry only." />
      <div className="grid gap-4 p-6">
        {blocked && (
          <Alert variant="destructive">
            <AlertDescription>
              Measurements blocked: QC status is Reject image or repeat plate.
            </AlertDescription>
          </Alert>
        )}
        <ImportedWorklistSummaryCard workflow={workflow} />

        {measurementPlan.length > 0 && (
          <Card aria-label="Active measurement plan">
            <CardHeader>
              <CardTitle className="text-base">Active measurement plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>diskPosition</TableHead>
                    <TableHead>antibioticCode</TableHead>
                    <TableHead>antibioticName</TableHead>
                    <TableHead>discPotency</TableHead>
                    <TableHead>notMeasured reason</TableHead>
                    <TableHead>notMeasured comment</TableHead>
                    <TableHead>Measure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurementPlan.map((disc) => (
                    <TableRow key={disc.id}>
                      <TableCell>{disc.diskPosition}</TableCell>
                      <TableCell>{disc.antibioticCode}</TableCell>
                      <TableCell>{disc.antibioticName}</TableCell>
                      <TableCell>{disc.discPotency}</TableCell>
                      <TableCell>
                        <Select
                          value={disc.notMeasuredReason}
                          onValueChange={(value) => {
                            saveDiscNotMeasuredReason(
                              disc.id,
                              (value === "measured" ? "" : value) as NotMeasuredReason,
                              disc.notMeasuredComment,
                            );
                            setRefresh((n) => n + 1);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Measured" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="measured">Measured / pending</SelectItem>
                            <SelectItem value="disc_missing">disc_missing</SelectItem>
                            <SelectItem value="disc_damaged">disc_damaged</SelectItem>
                            <SelectItem value="zone_unreadable">zone_unreadable</SelectItem>
                            <SelectItem value="contamination_or_mixed_growth">
                              contamination_or_mixed_growth
                            </SelectItem>
                            <SelectItem value="other">other</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={disc.notMeasuredComment}
                          placeholder="optional notMeasured comment"
                          onChange={(event) => {
                            saveDiscNotMeasuredReason(
                              disc.id,
                              disc.notMeasuredReason,
                              event.target.value,
                            );
                            setRefresh((n) => n + 1);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setForm({
                              ...form,
                              diskPosition: disc.diskPosition,
                              antimicrobialName: disc.antibioticName,
                              diskContent: disc.discPotency,
                              antibioticCode: disc.antibioticCode,
                              originalValue: "",
                              correctedValue: "",
                              reviewedBy: form.reviewedBy,
                              reviewedAt: form.reviewedAt,
                            })
                          }
                        >
                          Measure disc
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual zone entry</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(
              [
                "diskPosition",
                "antimicrobialName",
                "diskContent",
                "zoneDiameterMm",
                "comment",
                "antibioticCode",
                "overrideReason",
                "originalValue",
                "correctedValue",
                "reviewedBy",
                "reviewedAt",
              ] as const
            ).map((key) => (
              <Input
                key={key}
                placeholder={key}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ))}
            <Select
              value={form.readerConfidence}
              onValueChange={(v) => setForm({ ...form, readerConfidence: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="readerConfidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">high</SelectItem>
                <SelectItem value="medium">medium</SelectItem>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="manual">manual</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.measurementSource}
              onValueChange={(v) => setForm({ ...form, measurementSource: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="measurementSource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto_reader">auto_reader</SelectItem>
                <SelectItem value="manual_entry">manual_entry</SelectItem>
                <SelectItem value="reader_then_manual">reader_then_manual</SelectItem>
                <SelectItem value="imported">imported</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.reviewStatus}
              onValueChange={(v) => setForm({ ...form, reviewStatus: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="reviewStatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="accepted">accepted</SelectItem>
                <SelectItem value="rejected">rejected</SelectItem>
                <SelectItem value="needs_repeat">needs_repeat</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.manualEdited}
              onValueChange={(v) => setForm({ ...form, manualEdited: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="manualEdited" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">false</SelectItem>
                <SelectItem value="true">true</SelectItem>
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button disabled={blocked} onClick={() => saveMeasurement(false)}>
              {editingMeasurementId ? "Save measurement edits" : "Add measurement"}
            </Button>
            {editingMeasurementId && (
              <Button variant="outline" onClick={resetCorrectionForm}>
                Cancel edit
              </Button>
            )}
            {pendingDuplicate && (
              <div className="flex flex-wrap gap-2 rounded-md border border-amber-300 p-3 text-sm">
                <span>
                  Duplicate measurement detected for {pendingDuplicate.diskPosition} +{" "}
                  {pendingDuplicate.antibioticCode}.
                </span>
                <Button size="sm" variant="destructive" onClick={() => saveMeasurement(true)}>
                  Replace existing entry
                </Button>
                <Button size="sm" variant="outline" onClick={resetCorrectionForm}>
                  Cancel duplicate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>diskPosition</TableHead>
                  <TableHead>antibioticCode</TableHead>
                  <TableHead>antibioticName</TableHead>
                  <TableHead>zoneDiameterMm</TableHead>
                  <TableHead>readerConfidence</TableHead>
                  <TableHead>measurementSource</TableHead>
                  <TableHead>reviewStatus</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.map((m) => (
                  <TableRow key={`${m.id}-${refresh}`}>
                    <TableCell>{m.diskPosition}</TableCell>
                    <TableCell>{m.antibioticCode}</TableCell>
                    <TableCell>{m.antibioticName || m.antimicrobialName}</TableCell>
                    <TableCell>{m.zoneDiameterMm}</TableCell>
                    <TableCell>{m.readerConfidence}</TableCell>
                    <TableCell>{m.measurementSource}</TableCell>
                    <TableCell>{m.reviewStatus}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMeasurementId(m.id);
                            setPendingDuplicate(null);
                            setForm({
                              diskPosition: m.diskPosition,
                              antimicrobialName: m.antimicrobialName || m.antibioticName,
                              diskContent: m.diskContent || m.discPotency,
                              zoneDiameterMm: String(m.zoneDiameterMm),
                              comment: m.comment,
                              antibioticCode: m.antibioticCode,
                              readerConfidence: m.readerConfidence,
                              measurementSource: m.measurementSource,
                              reviewStatus: m.reviewStatus,
                              manualEdited: "true",
                              overrideReason: m.overrideReason,
                              originalValue: String(m.originalValue ?? m.zoneDiameterMm),
                              correctedValue: String(m.correctedValue ?? m.zoneDiameterMm),
                              reviewedBy: m.reviewedBy,
                              reviewedAt: m.reviewedAt || new Date().toISOString(),
                            });
                          }}
                        >
                          Edit measurement
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            deleteDiskMeasurement(m.id);
                            setRefresh((n) => n + 1);
                          }}
                        >
                          Delete measurement
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
