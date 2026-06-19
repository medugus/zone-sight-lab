import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  addDiskMeasurement,
  getWorkflowState,
  type DiscLayout,
  type DiskMeasurement,
} from "@/lib/diskdiff-store";

export const Route = createFileRoute("/measure")({ component: MeasurePage });

type ReaderConfidence = DiskMeasurement["readerConfidence"];
type MeasurementSource = DiskMeasurement["measurementSource"];

type RawDiscLocation = {
  id: string;
  x: number;
  y: number;
  radiusPx: number;
  source: "vision" | "layout_estimate";
  score: number;
};

type OcrRegion = {
  rawValue: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ReviewDisc = {
  id: string;
  xPx: number;
  yPx: number;
  radiusPx: number;
  xPct: number;
  yPct: number;
  diskPosition: string;
  antibioticCode: string;
  originalAntibioticCode: string;
  antimicrobialName: string;
  diskContent: string;
  zoneDiameterMm: string;
  originalZoneDiameterMm: number | null;
  confidence: ReaderConfidence;
  accepted: boolean;
  ocrText: string;
  sourceNote: string;
};

type TextDetectorLike = {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string; boundingBox: DOMRectReadOnly }>>;
};

const COMMON_ANTIBIOTIC_CODES = [
  "AMP",
  "AMC",
  "TZP",
  "CXM",
  "CRO",
  "CTX",
  "CAZ",
  "FEP",
  "ATM",
  "ETP",
  "MEM",
  "IPM",
  "DOR",
  "AMK",
  "GEN",
  "TOB",
  "CIP",
  "LVX",
  "MXF",
  "SXT",
  "TGC",
  "VAN",
  "TEC",
  "LZD",
  "CLI",
  "ERY",
  "TET",
  "DOX",
  "FOX",
  "OXA",
  "PEN",
  "NIT",
  "FOS",
  "CST",
  "RIF",
  "FUS",
  "MUP",
  "DAP",
  "HLG",
  "HLS",
  "QDA",
  "TOL",
  "CZA",
  "MIN",
  "CFD",
  "AMX",
  "AZM",
  "CLR",
  "CFM",
  "BPN",
];

function MeasurePage() {
  const workflow = getWorkflowState();
  const [form, setForm] = useState<any>({
    diskPosition: "",
    antimicrobialName: "",
    diskContent: "",
    zoneDiameterMm: "",
    comment: "",
    antibioticCode: "",
    readerConfidence: "manual",
    measurementSource: "manual_entry",
    reviewStatus: "accepted",
    manualEdited: false,
    overrideReason: "",
  });
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const plateSize = workflow.currentPlate?.plateSizeMm ?? 90;
  const qcStatus = workflow.plateQc?.qcStatus;
  const blocked = qcStatus === "Reject image or repeat plate";
  const discLayout = workflow.discLayout.filter((d) => d.expectedOnPlate);

  return (
    <div>
      <PageHeader
        title="Zone Measurement"
        description="Live camera-assisted disc finding, OCR label review, and supervised zone entry."
      />
      <div className="grid gap-4 p-6">
        {blocked && (
          <Alert variant="destructive">
            <AlertDescription>Measurements blocked: QC status is Reject image or repeat plate.</AlertDescription>
          </Alert>
        )}

        <LiveCameraDiscReader
          blocked={blocked}
          plateSize={plateSize}
          discLayout={discLayout}
          operator={workflow.currentPlate?.createdBy ?? ""}
          onRowsApplied={() => setTick((n) => n + 1)}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual entry</CardTitle>
            <CardDescription>Use this for ruler entry, corrections, or when camera/OCR is unavailable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                "diskPosition",
                "antimicrobialName",
                "diskContent",
                "zoneDiameterMm",
                "comment",
                "antibioticCode",
                "readerConfidence",
                "measurementSource",
                "reviewStatus",
                "manualEdited",
                "overrideReason",
              ].map((k) => (
                <Input
                  key={k}
                  placeholder={k}
                  value={String(form[k])}
                  onChange={(e) => setForm({ ...form, [k]: k === "manualEdited" ? e.target.value === "true" : e.target.value })}
                />
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              disabled={blocked}
              onClick={() => {
                const z = Number(form.zoneDiameterMm);
                if (Number.isNaN(z)) {
                  setError("zone diameter must be numeric");
                  return;
                }
                if (z < 6) {
                  setError("zone diameter cannot be below 6 mm");
                  return;
                }
                if (z > plateSize) {
                  setError("zone diameter cannot exceed selected plate size");
                  return;
                }
                setError("");
                addDiskMeasurement({
                  diskPosition: form.diskPosition,
                  antimicrobialName: form.antimicrobialName,
                  diskContent: form.diskContent,
                  zoneDiameterMm: z,
                  measurementMethod: "Manual ruler",
                  comment: form.comment,
                  antibioticCode: form.antibioticCode,
                  antibioticName: form.antimicrobialName,
                  discPotency: form.diskContent,
                  readerConfidence: form.readerConfidence,
                  measurementSource: form.measurementSource,
                  manualEdited: form.manualEdited,
                  originalValue: null,
                  correctedValue: null,
                  overrideReason: form.overrideReason,
                  reviewedBy: workflow.currentPlate?.createdBy ?? "",
                  reviewedAt: new Date().toISOString(),
                  reviewStatus: form.reviewStatus,
                });
                setTick((n) => n + 1);
              }}
            >
              Add measurement
            </Button>
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
                  <TableHead>Position</TableHead>
                  <TableHead>Antibiotic code</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getWorkflowState().measurements.map((m) => (
                  <TableRow key={m.id + tick}>
                    <TableCell>{m.diskPosition}</TableCell>
                    <TableCell>{m.antibioticCode}</TableCell>
                    <TableCell>{m.zoneDiameterMm} mm</TableCell>
                    <TableCell>{m.measurementMethod}</TableCell>
                    <TableCell>{m.measurementSource}</TableCell>
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

function LiveCameraDiscReader({
  blocked,
  plateSize,
  discLayout,
  operator,
  onRowsApplied,
}: {
  blocked: boolean;
  plateSize: number;
  discLayout: DiscLayout[];
  operator: string;
  onRowsApplied: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Camera not started.");
  const [reviewRows, setReviewRows] = useState<ReviewDisc[]>([]);
  const [applyMessage, setApplyMessage] = useState("");

  const expectedCodes = useMemo(
    () => discLayout.map((d) => d.antibioticCode).filter(Boolean),
    [discLayout],
  );

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setApplyMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("This browser does not expose camera access to the page.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setStatus("Camera is live. Centre the whole plate, avoid glare, then analyse frame.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  async function analyseFrame() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setStatus("Camera frame is not ready yet.");
      return;
    }

    setBusy(true);
    setApplyMessage("");
    try {
      const canvas = canvasRef.current;
      const maxWidth = 900;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not prepare camera canvas.");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const expectedCount = discLayout.length || 6;
      let located = detectDiscLocations(imageData, expectedCount);
      let usedFallback = false;
      if (located.length === 0 || (discLayout.length > 0 && located.length < Math.min(3, discLayout.length))) {
        located = buildLayoutEstimateLocations(expectedCount, canvas.width, canvas.height);
        usedFallback = true;
      }

      const ocr = await runBrowserTextDetection(canvas);
      const rows = buildReviewRows({
        located,
        ocrRegions: ocr.regions,
        discLayout,
        expectedCodes,
        width: canvas.width,
        height: canvas.height,
        usedFallback,
      });
      drawDiscOverlay(canvas, rows);
      setReviewRows(rows);

      const ocrPart = ocr.supported
        ? `OCR returned ${ocr.regions.length} text region(s).`
        : "Browser OCR is not available here, so codes are seeded from the worklist/layout when possible.";
      setStatus(`Found ${rows.length} candidate disc(s). ${ocrPart} Review every row before adding measurements.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function updateReviewRow(id: string, patch: Partial<ReviewDisc>) {
    setReviewRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addAcceptedRows() {
    const acceptedRows = reviewRows.filter((row) => row.accepted);
    if (acceptedRows.length === 0) {
      setApplyMessage("No accepted camera rows selected.");
      return;
    }

    const invalid = acceptedRows.find((row) => {
      const z = Number(row.zoneDiameterMm);
      return !row.antibioticCode.trim() || !Number.isFinite(z) || z < 6 || z > plateSize;
    });
    if (invalid) {
      setApplyMessage("Each accepted row needs an antibiotic code and a numeric zone diameter within the plate size.");
      return;
    }

    for (const row of acceptedRows) {
      const zoneDiameterMm = Number(row.zoneDiameterMm);
      const code = row.antibioticCode.trim().toUpperCase();
      const codeEdited = code !== row.originalAntibioticCode;
      const zoneEdited = row.originalZoneDiameterMm === null || zoneDiameterMm !== row.originalZoneDiameterMm;
      const manualEdited = codeEdited || zoneEdited;
      const measurementSource: MeasurementSource = manualEdited ? "reader_then_manual" : "auto_reader";
      addDiskMeasurement({
        diskPosition: row.diskPosition,
        antimicrobialName: row.antimicrobialName || code,
        diskContent: row.diskContent,
        zoneDiameterMm,
        measurementMethod: "Camera assisted",
        comment: [row.sourceNote, row.ocrText ? `OCR: ${row.ocrText}` : "OCR: none"].join("; "),
        antibioticCode: code,
        antibioticName: row.antimicrobialName || code,
        discPotency: row.diskContent,
        readerConfidence: row.confidence,
        measurementSource,
        manualEdited,
        originalValue: row.originalZoneDiameterMm,
        correctedValue: manualEdited ? zoneDiameterMm : null,
        overrideReason: manualEdited ? "Camera-assisted disc/OCR result reviewed and confirmed by operator." : "",
        reviewedBy: operator,
        reviewedAt: new Date().toISOString(),
        reviewStatus: "accepted",
      });
    }

    setReviewRows((rows) => rows.map((row) => (row.accepted ? { ...row, accepted: false } : row)));
    setApplyMessage(`Added ${acceptedRows.length} camera-assisted measurement(s).`);
    onRowsApplied();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Live camera disc reader</CardTitle>
        <CardDescription>
          Finds likely paper discs in the camera frame and attempts abbreviation OCR. Confirm codes and enter/confirm zone diameters before adding measurements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            OCR and computer-vision detection are decision support only. Poor lighting, glare, overlapping zones, or small printed labels require manual correction.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-md border bg-black">
              <video ref={videoRef} className="aspect-video w-full object-contain" playsInline muted />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={startCamera} disabled={blocked || cameraOn}>
                Start live camera
              </Button>
              <Button type="button" variant="secondary" onClick={analyseFrame} disabled={blocked || !cameraOn || busy}>
                {busy ? "Analysing..." : "Locate discs + read labels"}
              </Button>
              <Button type="button" variant="outline" onClick={stopCamera} disabled={!cameraOn}>
                Stop camera
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>

          <div className="space-y-3">
            <canvas ref={canvasRef} className="min-h-48 w-full rounded-md border bg-muted/30" />
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">Expected layout</div>
              {discLayout.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {discLayout.map((d) => (
                    <span key={d.id} className="rounded bg-background px-2 py-1">
                      {d.diskPosition || "disc"}: {d.antibioticCode || "code?"}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1">No imported LIMS worklist/layout yet. OCR can still suggest codes, but review will need more manual entry.</p>
              )}
            </div>
          </div>
        </div>

        {reviewRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Review detected discs</h3>
              <Button type="button" onClick={addAcceptedRows} disabled={blocked}>
                Add accepted rows to measurements
              </Button>
            </div>
            {applyMessage && <p className="text-xs text-muted-foreground">{applyMessage}</p>}
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Use</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Antibiotic code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Potency</TableHead>
                    <TableHead>Zone mm</TableHead>
                    <TableHead>OCR</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={row.accepted}
                          onChange={(e) => updateReviewRow(row.id, { accepted: e.target.checked })}
                        />
                      </TableCell>
                      <TableCell className="min-w-28">
                        <Input
                          value={row.diskPosition}
                          onChange={(e) => updateReviewRow(row.id, { diskPosition: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="min-w-28">
                        <Input
                          value={row.antibioticCode}
                          onChange={(e) => updateReviewRow(row.id, { antibioticCode: e.target.value.toUpperCase() })}
                        />
                      </TableCell>
                      <TableCell className="min-w-44">
                        <Input
                          value={row.antimicrobialName}
                          onChange={(e) => updateReviewRow(row.id, { antimicrobialName: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="min-w-28">
                        <Input
                          value={row.diskContent}
                          onChange={(e) => updateReviewRow(row.id, { diskContent: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="min-w-28">
                        <Input
                          inputMode="decimal"
                          value={row.zoneDiameterMm}
                          onChange={(e) => updateReviewRow(row.id, { zoneDiameterMm: e.target.value })}
                          placeholder="mm"
                        />
                      </TableCell>
                      <TableCell className="max-w-40 text-xs text-muted-foreground">{row.ocrText || "-"}</TableCell>
                      <TableCell className="text-xs">{row.confidence}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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

async function runBrowserTextDetection(canvas: HTMLCanvasElement): Promise<{ supported: boolean; regions: OcrRegion[] }> {
  const Detector = (window as unknown as { TextDetector?: new () => TextDetectorLike }).TextDetector;
  if (!Detector) return { supported: false, regions: [] };
  try {
    const detector = new Detector();
    const detected = await detector.detect(canvas);
    return {
      supported: true,
      regions: detected.map((item) => ({
        rawValue: item.rawValue ?? "",
        x: item.boundingBox.x,
        y: item.boundingBox.y,
        width: item.boundingBox.width,
        height: item.boundingBox.height,
      })),
    };
  } catch {
    return { supported: true, regions: [] };
  }
}

function detectDiscLocations(imageData: ImageData, wantedCount: number): RawDiscLocation[] {
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const components: RawDiscLocation[] = [];
  const minDim = Math.min(width, height);
  const maxComponentArea = width * height * 0.035;

  function isCandidatePixel(index: number) {
    const offset = index * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const brightness = (r + g + b) / 3;
    const chroma = max - min;
    return brightness > 170 && chroma < 55;
  }

  for (let y = 2; y < height - 2; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const start = y * width + x;
      if (visited[start] || !isCandidatePixel(start)) continue;

      let area = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      const stack = [start];
      visited[start] = 1;

      while (stack.length > 0) {
        const idx = stack.pop()!;
        const px = idx % width;
        const py = Math.floor(idx / width);
        area += 1;
        sumX += px;
        sumY += py;
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);

        const neighbours = [idx - 1, idx + 1, idx - width, idx + width];
        for (const next of neighbours) {
          if (next < 0 || next >= visited.length || visited[next]) continue;
          if (!isCandidatePixel(next)) continue;
          visited[next] = 1;
          stack.push(next);
        }
      }

      if (area < 30 || area > maxComponentArea) continue;
      const boxW = maxX - minX + 1;
      const boxH = maxY - minY + 1;
      if (boxW < 6 || boxH < 6) continue;
      if (boxW > minDim * 0.18 || boxH > minDim * 0.18) continue;
      const aspect = Math.max(boxW, boxH) / Math.max(1, Math.min(boxW, boxH));
      if (aspect > 1.9) continue;
      const fill = area / (boxW * boxH);
      if (fill < 0.22) continue;

      const radiusPx = (boxW + boxH) / 4;
      components.push({
        id: `vision-${components.length}`,
        x: sumX / area,
        y: sumY / area,
        radiusPx,
        source: "vision",
        score: area * fill * (1 / aspect),
      });
    }
  }

  const deduped: RawDiscLocation[] = [];
  for (const component of components.sort((a, b) => b.score - a.score)) {
    const overlaps = deduped.some((existing) => distance(existing, component) < Math.max(existing.radiusPx, component.radiusPx) * 1.8);
    if (!overlaps) deduped.push(component);
    if (deduped.length >= Math.max(wantedCount || 0, 12)) break;
  }

  const sorted = sortClockwise(deduped);
  return wantedCount > 0 ? sorted.slice(0, wantedCount) : sorted.slice(0, 12);
}

function buildLayoutEstimateLocations(count: number, width: number, height: number): RawDiscLocation[] {
  const safeCount = Math.max(1, count || 6);
  const cx = width / 2;
  const cy = height / 2;
  const ringRadius = Math.min(width, height) * 0.3;
  const discRadius = Math.min(width, height) * 0.028;
  return Array.from({ length: safeCount }, (_, index) => {
    const angle = -Math.PI / 2 + (index / safeCount) * Math.PI * 2;
    return {
      id: `layout-${index}`,
      x: cx + Math.cos(angle) * ringRadius,
      y: cy + Math.sin(angle) * ringRadius,
      radiusPx: discRadius,
      source: "layout_estimate" as const,
      score: 0,
    };
  });
}

function buildReviewRows({
  located,
  ocrRegions,
  discLayout,
  expectedCodes,
  width,
  height,
  usedFallback,
}: {
  located: RawDiscLocation[];
  ocrRegions: OcrRegion[];
  discLayout: DiscLayout[];
  expectedCodes: string[];
  width: number;
  height: number;
  usedFallback: boolean;
}): ReviewDisc[] {
  const byCode = new Map(discLayout.map((item) => [item.antibioticCode.toUpperCase(), item]));
  return sortClockwise(located).map((disc, index) => {
    const expected = discLayout[index];
    const nearestText = nearestTextForDisc(disc, ocrRegions);
    const ocrCode = nearestText ? normalizeAntibioticCode(nearestText.rawValue, expectedCodes) : "";
    const code = (ocrCode || expected?.antibioticCode || "").toUpperCase();
    const matchedLayout = byCode.get(code) ?? expected;
    const confidence: ReaderConfidence = disc.source === "vision" ? (ocrCode ? "high" : matchedLayout ? "medium" : "low") : "low";
    return {
      id: `${disc.id}-${index}-${Date.now()}`,
      xPx: disc.x,
      yPx: disc.y,
      radiusPx: disc.radiusPx,
      xPct: Math.round((disc.x / width) * 1000) / 10,
      yPct: Math.round((disc.y / height) * 1000) / 10,
      diskPosition: matchedLayout?.diskPosition || expected?.diskPosition || `D${index + 1}`,
      antibioticCode: code,
      originalAntibioticCode: code,
      antimicrobialName: matchedLayout?.antibioticName || code,
      diskContent: matchedLayout?.discPotency || "",
      zoneDiameterMm: "",
      originalZoneDiameterMm: null,
      confidence,
      accepted: Boolean(code),
      ocrText: nearestText?.rawValue ?? "",
      sourceNote: usedFallback
        ? "Disc position estimated from expected layout because image detection was insufficient"
        : `Disc located by camera analysis at ${Math.round((disc.x / width) * 100)}%, ${Math.round((disc.y / height) * 100)}%`,
    };
  });
}

function nearestTextForDisc(disc: RawDiscLocation, regions: OcrRegion[]): OcrRegion | undefined {
  let best: { region: OcrRegion; distance: number } | undefined;
  for (const region of regions) {
    const cx = region.x + region.width / 2;
    const cy = region.y + region.height / 2;
    const d = Math.hypot(cx - disc.x, cy - disc.y);
    if (d > Math.max(28, disc.radiusPx * 4)) continue;
    if (!best || d < best.distance) best = { region, distance: d };
  }
  return best?.region;
}

function normalizeAntibioticCode(raw: string, expectedCodes: string[]) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!cleaned) return "";
  const candidates = Array.from(new Set([...expectedCodes, ...COMMON_ANTIBIOTIC_CODES]))
    .filter(Boolean)
    .map((code) => code.toUpperCase())
    .sort((a, b) => b.length - a.length);
  for (const code of candidates) {
    if (cleaned === code || cleaned.startsWith(code) || cleaned.endsWith(code)) return code;
  }
  return cleaned.match(/[A-Z]{2,3}/)?.[0] ?? "";
}

function drawDiscOverlay(canvas: HTMLCanvasElement, rows: ReviewDisc[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.lineWidth = 3;
  ctx.font = "bold 14px sans-serif";
  for (const row of rows) {
    ctx.strokeStyle = row.confidence === "high" ? "#22c55e" : row.confidence === "medium" ? "#f59e0b" : "#ef4444";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc(row.xPx, row.yPx, Math.max(12, row.radiusPx + 6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(row.antibioticCode || row.diskPosition, row.xPx + 10, row.yPx - 10);
  }
  ctx.restore();
}

function sortClockwise(discs: RawDiscLocation[]) {
  if (discs.length <= 1) return discs;
  const cx = discs.reduce((sum, disc) => sum + disc.x, 0) / discs.length;
  const cy = discs.reduce((sum, disc) => sum + disc.y, 0) / discs.length;
  return [...discs].sort((a, b) => angleFromTop(a, cx, cy) - angleFromTop(b, cx, cy));
}

function angleFromTop(disc: RawDiscLocation, cx: number, cy: number) {
  const angle = Math.atan2(disc.y - cy, disc.x - cx) + Math.PI / 2;
  return angle < 0 ? angle + Math.PI * 2 : angle;
}

function distance(a: RawDiscLocation, b: RawDiscLocation) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
