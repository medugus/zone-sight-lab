# Zone Reader live Send to LIS acceptance — current state

## Current capability

Zone Reader now has a minimal outbound live action on the Reports page:

- UI action: `Send to LIS`
- Send builder: `sendCurrentZoneResultToLis()`
- HTTP sender: `sendValidatedZoneResultEnvelope()`
- Existing fallback: `Export Zone Result JSON`

The action submits only the existing schema-validated Zone Result envelope to Medugu. It does not add synchronization, inboxes, polling, sockets, retry daemons, webhook verification, breakpoint loaders, barcode handling, or LIS-side interpretation.

## Payload contract

The payload sent over the wire is the same envelope returned by `exportZoneResultJson()` for manual JSON export, revalidated by `ZoneResultEnvelopeSchema` immediately before the request.

Required live-send invariants:

- `notForClinicalRelease: true`
- `releaseAuthority: "LIS"`
- `sourceSystem: "DISKDIFF_READER"`
- `method: "disk_diffusion"`
- measurement-only result rows only

No interpretation, stewardship, IPC, validation, or release fields are added by Zone Reader.

## Authentication

Zone Reader sends:

```text
Authorization: Bearer <Medugu ZoneResult token>
Content-Type: application/json
```

The token is operator-entered on the Reports page for this minimal step. Medugu remains responsible for accepting or rejecting the bearer token at its inbound boundary.

## UI acceptance states

The Reports page displays clear send states:

| State | Meaning |
| --- | --- |
| Ready to send | The action is idle and ready for a validated envelope. |
| Sending | The POST request is in progress. |
| Sent successfully | Medugu accepted the request; Zone Reader shows a concise accepted-row/audit summary only. |
| Failed | The payload failed readiness/schema validation before send, the token is missing/invalid, Medugu rejected the request, or the network request failed. |

Manual `Export Zone Result JSON` remains visible as the fallback path on the same page.

## Tests refreshed

The live send tests cover:

- send success with exact payload reuse and bearer auth header
- auth failure (`401 unauthenticated`) with readable UI/send state
- schema validation failure before send, with no network call
- network/request failure with readable failed state
- manual JSON export remaining visible as fallback

## Boundary notes

Medugu may return row-match, mapped-row, idempotency, audit, or rejection information. Zone Reader shows only concise send status text from that response. It does not display LIS interpretation controls and does not take ownership of Medugu row review, stewardship, IPC, validation, or release workflows.
