"""Immutable, strict VELION task/model interface boundaries."""
from dataclasses import dataclass
import re
PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_.:-]{2,79}$")
SHA = re.compile(r"^[0-9a-f]{64}$")
CAPS = frozenset(("text:analyze","code:review","incident:triage","plan:software"))
DATA = frozenset(("PUBLIC_SYNTHETIC","PUBLIC_VERIFIED"))
class ContractError(ValueError):
    """Fails closed on invalid input or missing capability."""

def valid_id(v):
    return type(v) is str and bool(PATTERN.fullmatch(v))

@dataclass(frozen=True)
class Task:
    task_id: str
    tenant_id: str
    orchestrator_id: str
    agent_id: str
    capability: str
    data_class: str
    input_sha256: str
    mode: str = "STANDARD"
    budget_cents: int = 0
    external_effects: bool = False
    action: str = "PROPOSAL_ONLY"
    def __post_init__(self):
        if any(not valid_id(x) for x in (self.task_id,self.tenant_id,self.orchestrator_id,self.agent_id)):
            raise ContractError("ID_INVALID")
        if self.capability not in CAPS or self.data_class not in DATA:
            raise ContractError("SCOPE_DENIED")
        if type(self.input_sha256) is not str or not SHA.fullmatch(self.input_sha256):
            raise ContractError("DIGEST_INVALID")
        if self.mode not in ("STANDARD","MAX"):
            raise ContractError("MODE_DENIED")
        if type(self.budget_cents) is not int or self.budget_cents != 0:
            raise ContractError("FREE_ONLY")
        if self.external_effects is not False or self.action != "PROPOSAL_ONLY":
            raise ContractError("EXECUTION_DENIED")

@dataclass(frozen=True)
class ModelDescriptor:
    model_id: str
    provider_id: str
    capabilities: tuple
    allowed_data_classes: tuple
    verified_digest: str
    local: bool
    healthy: bool
    supports_max: bool
    free_only: bool
    priority: int
    context_tokens: int
    max_output_tokens: int
    def __post_init__(self):
        if not valid_id(self.model_id) or not valid_id(self.provider_id):
            raise ContractError("MODEL_ID_DENIED")
        if type(self.verified_digest) is not str or not SHA.fullmatch(self.verified_digest):
            raise ContractError("MODEL_DIGEST_DENIED")
        if (not isinstance(self.capabilities,tuple) or not self.capabilities or
            any(c not in CAPS for c in self.capabilities) or len(self.capabilities)!=len(set(self.capabilities))):
            raise ContractError("MODEL_CAPABILITIES_DENIED")
        if (not isinstance(self.allowed_data_classes,tuple) or not self.allowed_data_classes or
            any(c not in DATA for c in self.allowed_data_classes)):
            raise ContractError("MODEL_DATA_DENIED")
        if any(type(x) is not bool for x in (self.local,self.healthy,self.supports_max,self.free_only)):
            raise ContractError("MODEL_FLAGS_DENIED")
        if type(self.priority) is not int or not 0<=self.priority<=999:
            raise ContractError("MODEL_PRIORITY_DENIED")
        if type(self.context_tokens) is not int or not 128<=self.context_tokens<=1_000_000:
            raise ContractError("MODEL_CONTEXT_DENIED")
        if type(self.max_output_tokens) is not int or not 32<=self.max_output_tokens<=65_536:
            raise ContractError("MODEL_OUTPUT_DENIED")
