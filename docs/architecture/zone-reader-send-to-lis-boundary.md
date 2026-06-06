# Zone Reader Send to LIS boundary

## Scope

This boundary adds the first minimal live outbound action from Zone Reader to Medugu. It is a user-triggered, request/response-only submission of the existing Zone Result payload to the authenticated Medugu inbound endpoint.

It does not add polling, sockets, webhooks, retry daemons, inboxes, bidirectional synchronization, barcode work, breakpoint loaders, or LIS-side interpretation logic.

## User action

The Reports page exposes a `Send to LIS` action next to the existing manual `Export Zone Result JSON` fallback. The action is intentionally manual:

1. The operator/reviewer completes the existing export-readiness gates.
2. Zone Reader builds the same Zone Result envelope used by manual JSON export via `exportZoneResultJson()`.
3. `sendCurrentZoneResultToLis()` validates that envelope again with `ZoneResultEnvelopeSchema`.
4. `sendValidatedZoneResultEnvelope()` posts the JSON body to the Medugu endpoint.
5. Zone Reader displays only a concise send result state.

Manual JSON export remains available if live sending fails or is not configured.

## Endpoint and authentication

Default endpoint:

```text
POST /api/medugu/zone-results
```

Authentication uses the same bearer-token mechanism expected by the Medugu inbound boundary:

```text
Authorization: Bearer <Medugu ZoneResult token>
Content-Type: application/json
```

The Reports page accepts the endpoint and token as operator-entered fields for this minimal live action. The token is sent only in the HTTP `Authorization` header and is not included in the Zone Result payload.

## Exact payload sent

The request body is exactly `JSON.stringify(exportZoneResultJson())` after a second `ZoneResultEnvelopeSchema.safeParse(...)` validation pass. No additional fields are added for live send.

Current envelope shape:

```json
{
  "schemaVersion": "1.0.0",
  "contractVersion": "1.0.0",
  "sourceSystem": "DISKDIFF_READER",
  "notForClinicalRelease": true,
  "releaseAuthority": "LIS",
  "readerDeviceId": "<captureDevice>",
  "readerSoftwareVersion": "DiskDiff Reader v1",
  "operator": "<createdBy>",
  "readAt": "<ISO datetime>",
  "accessionId": "<externalLisAccessionId or accessionNumber>",
  "accessionNumber": "<accessionNumber>",
  "isolateId": "<isolateId>",
  "astPanelId": "<astPanelId>",
  "method": "disk_diffusion",
  "standard": "EUCAST|CLSI|LOCAL",
  "plateBarcode": "<plateBarcode>",
  "imageReference": "<imageUrl>",
  "results": [
    {
      "antibioticCode": "<code>",
      "antibioticName": "<name>",
      "discPotency": "<potency>",
      "diskPosition": "<position>",
      "zoneDiameterMm": 18,
      "readerConfidence": "high|medium|low|manual",
      "measurementSource": "auto_reader|manual_entry|reader_then_manual|imported",
      "manualEdited": false,
      "originalValue": null,
      "correctedValue": null,
      "overrideReason": null,
      "reviewStatus": "accepted",
      "reviewedBy": "<reviewer>",
      "reviewedAt": "<ISO datetime>",
      "comment": ""
    }
  ],
  "audit": []
}
```

For this live LIS send, the outbound guard requires these invariants before any network request:

- `notForClinicalRelease = true`
- `releaseAuthority = "LIS"`
- Zone Reader remains measurement-only authority; Medugu owns interpretation, stewardship, IPC, validation, and release.

## User-facing states

The Reports page shows these states:

- `Ready to send` — initial state before the operator clicks send.
- `Sending` — request is in flight and the send button is disabled.
- `Sent successfully` — Medugu accepted the request. The message includes accepted row count, audit id when returned, and whether the request was idempotent.
- `Failed` — pre-send schema/readiness errors, missing token, HTTP rejection, auth failure, or network/request failure. The message contains a readable reason.

If Medugu returns row-match or row-review details, Zone Reader summarizes only the outcome (for example, accepted row count or rejection details). It does not recreate LIS interpretation or review UI.
