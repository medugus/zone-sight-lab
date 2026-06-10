import { createFileRoute } from "@tanstack/react-router";
import {
  handleMeduguZoneResultInboundRequest,
  type ZoneResultIntakeStore,
  MEDUGU_ZONE_RESULT_TOKEN_ENV,
} from "../../../../lib/medugu-zone-result-intake";

const meduguZoneResultIntakeStore: ZoneResultIntakeStore = {
  accessions: [],
  inboundAudit: [],
};

function readIntakeToken() {
  return (
    (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process
      ?.env?.[MEDUGU_ZONE_RESULT_TOKEN_ENV] ?? ""
  );
}

export const Route = createFileRoute("/api/public/zone-reader/result")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleMeduguZoneResultInboundRequest(request, meduguZoneResultIntakeStore, {
          intakeToken: readIntakeToken(),
        }),
    },
  },
});
