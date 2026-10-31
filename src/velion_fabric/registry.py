"""Deterministic model selection; no network access, cost or model execution."""
from .contracts import ModelDescriptor, Task, ContractError
def select_model(task: Task, models: tuple, *, allow_remote: bool=False) -> ModelDescriptor:
    if type(allow_remote) is not bool or not isinstance(models,tuple):
        raise ContractError("REGISTRY_DENIED")
    if any(not isinstance(m,ModelDescriptor) for m in models):
        raise ContractError("MODEL_TYPE_DENIED")
    if len({(m.provider_id,m.model_id) for m in models})!=len(models):
        raise ContractError("DUPLICATE_MODEL")
    candidates=[m for m in models if m.healthy and m.free_only
       and (m.local or allow_remote)
       and task.capability in m.capabilities
       and task.data_class in m.allowed_data_classes
       and (task.mode!="MAX" or m.supports_max)]
    if not candidates:
        raise ContractError("NO_ELIGIBLE_MODEL")
    candidates.sort(key=lambda m:(m.priority,not m.local,m.provider_id,m.model_id))
    return candidates[0]
