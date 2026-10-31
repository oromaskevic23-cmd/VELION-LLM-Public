# VELION Fabric v2 — Contract Specification

**Source:** [src/velion_fabric](../src/velion_fabric). **Compatibility:** preserve previous [v1 reviewed-task router](../src/velion_model_router.py) and [localhost gateway](../scripts/velion_private_api.py).

## Independent modules

- `contracts.py`: frozen Task and ModelDescriptor validation; unsupported capabilities/data/modes and spending fail closed.
- `policy.py`: default kill switch engaged; requires explicit synthetic approval and exact tenant/orchestrator/NCA allowlist for local planning. **This is not a production signed Approval Gateway.**
- `registry.py`: deterministic eligible provider/model selection; healthy, compatible, FREE_ONLY and local by default.
- `engine.py`: evidence-linked bounded route plan; SHA-256 receipt; absolutely no provider calls, tools or execution.
- `MAX` is one VELION mode; it is never a separate LLM identity.

## Security invariants

Identity is not authority. A model provider cannot grant itself approval. Real production must validate separately issued AI Passport, Enterprise Skills, Guardian Core and Approval Gateway, signed manifests, nonce/replay, tenancy, isolated worker, independent QA, external Audit Ledger and revocation.

This source validates **declared** model digest formatting only; future provider adapters must validate actual model bytes/revision and rights. The current receipt does not cryptographically attest production execution.

## Future HTTP endpoints (NOT DEPLOYED)

`POST /v2/proposals/plan`: guarded route plan. `POST /v2/proposals/generate`: separate protected inference service. `GET /v2/evidence/{id}`: tenant-scoped verification. These are target interface designs, not running URLs.

## Acceptance criteria

Do not call the v2 system production-ready until signed issuer custody, persistent replay protection, full tenant separation, real inference, independently measured quality, rollback and security proof are verified. Public source and synthetic tests do not establish commercial rights or production authorization.
