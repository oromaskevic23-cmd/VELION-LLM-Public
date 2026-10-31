"""VELION v2 composable policy, registry, bounded mode and SHA-256 route receipt."""
import hashlib
import json
from .contracts import Task, ContractError
from .policy import verify_task_policy
from .registry import select_model

def plan_proposal(task:Task,models:tuple,*,allowed_routes:frozenset,
                  kill_switch:bool=True,synthetic_approval:bool=False,
                  allow_remote:bool=False)->dict:
    if not isinstance(task,Task):
        raise ContractError("TASK_DENIED")
    verify_task_policy(task,allowed_routes=allowed_routes,kill_switch=kill_switch,
                       synthetic_approval=synthetic_approval)
    model=select_model(task,models,allow_remote=allow_remote)
    ctx=min(16384 if task.mode=="MAX" else 4096,model.context_tokens)
    output=min(2048 if task.mode=="MAX" else 512,model.max_output_tokens)
    record=dict(schema="velion.route.v2",task_id=task.task_id,
        tenant_id=task.tenant_id,orchestrator_id=task.orchestrator_id,
        agent_id=task.agent_id,capability=task.capability,data_class=task.data_class,
        input_sha256=task.input_sha256,model_id=model.model_id,provider_id=model.provider_id,
        model_digest=model.verified_digest,mode=task.mode,
        context_tokens=ctx,output_tokens=output,planned_cost_cents=0,
        execution_authorized=False,stage="ROUTE_PLAN_ONLY")
    raw=json.dumps(record,sort_keys=True,separators=(",",":"),allow_nan=False).encode()
    return {**record,"receipt_sha256":hashlib.sha256(raw).hexdigest(),
        "provenance":"REGISTERED_DECLARED_DIGEST_NOT_WEIGHT_RECHECKED",
        "production_authorized":False,"independent_qa_performed":False}
