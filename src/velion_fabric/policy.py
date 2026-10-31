"""Deny-by-default local policy fixture, NOT production AI Passport or Approval."""
from .contracts import Task, ContractError
def verify_task_policy(task: Task, *, allowed_routes: frozenset,
                       kill_switch: bool=True, synthetic_approval: bool=False):
    if type(kill_switch) is not bool or type(synthetic_approval) is not bool:
        raise ContractError("POLICY_TYPE_DENIED")
    if kill_switch:
        raise ContractError("OWNER_KILL_SWITCH")
    if not synthetic_approval:
        raise ContractError("SYNTHETIC_APPROVAL_REQUIRED")
    if not isinstance(allowed_routes,frozenset):
        raise ContractError("ROUTE_TYPE_DENIED")
    if (task.tenant_id,task.orchestrator_id,task.agent_id) not in allowed_routes:
        raise ContractError("FEDERATED_ROUTE_DENIED")
    if task.action!="PROPOSAL_ONLY" or task.external_effects or task.budget_cents!=0:
        raise ContractError("EXECUTION_DENIED")
