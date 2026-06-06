import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InterpretationAuthority, OperatingMode } from "@/lib/diskdiff-store";

export function isLisConnectedMeasurementOnly(
  operatingMode: OperatingMode,
  interpretationAuthority: InterpretationAuthority,
) {
  return operatingMode !== "standalone" && interpretationAuthority === "measurement_only";
}

export function InterpretationAuthorityNotice({
  operatingMode,
  interpretationAuthority,
}: {
  operatingMode: OperatingMode;
  interpretationAuthority: InterpretationAuthority;
}) {
  if (!isLisConnectedMeasurementOnly(operatingMode, interpretationAuthority)) return null;

  return (
    <Alert aria-label="S/I/R editing disabled">
      <AlertDescription>
        LIS-connected measurement-only mode is active. Zone Reader records measurements and audit
        metadata only; S/I/R verdict editing and final release remain disabled here.
      </AlertDescription>
    </Alert>
  );
}
