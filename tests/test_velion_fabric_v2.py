"""Real VELION v2 offline planner contract tests: no external model or tools."""
import dataclasses
import unittest
from velion_fabric import Task, ModelDescriptor, ContractError, plan_proposal

ROUTES=frozenset({("tenant-demo","orchestrator-a","NCA-424")})
def task(**kw):
    d=dict(task_id="TASK-001",tenant_id="tenant-demo",orchestrator_id="orchestrator-a",
        agent_id="NCA-424",capability="code:review",
        data_class="PUBLIC_SYNTHETIC",input_sha256="a"*64)
    d.update(kw)
    return Task(**d)
def model(**kw):
    d=dict(model_id="model-001",provider_id="provider-001",
        capabilities=("code:review",),allowed_data_classes=("PUBLIC_SYNTHETIC",),
        verified_digest="b"*64,local=True,healthy=True,supports_max=True,
        free_only=True,priority=1,context_tokens=8192,max_output_tokens=1024)
    d.update(kw)
    return ModelDescriptor(**d)
def plan(t=None,ms=None,**kw):
    return plan_proposal(t if t is not None else task(),
        ms if ms is not None else (model(),),
        allowed_routes=ROUTES,kill_switch=False,synthetic_approval=True,**kw)

class FabricV2Tests(unittest.TestCase):
    def test_standard_plan(self):
        p=plan();self.assertEqual(p["stage"],"ROUTE_PLAN_ONLY")
        self.assertFalse(p["execution_authorized"])
    def test_max_is_only_mode(self):
        p=plan(task(mode="MAX"))
        self.assertEqual(p["mode"],"MAX")
        self.assertEqual(p["model_id"],"model-001")
    def test_receipt_determinism(self):
        self.assertEqual(plan()["receipt_sha256"],plan()["receipt_sha256"])
    def test_max_context_is_model_bounded(self):
        self.assertEqual(plan(task(mode="MAX"))["context_tokens"],8192)
    def test_max_output_is_model_bounded(self):
        self.assertEqual(plan(task(mode="MAX"))["output_tokens"],1024)
    def test_free_only_and_no_execution(self):
        p=plan(task(mode="MAX"))
        self.assertEqual(p["planned_cost_cents"],0)
        self.assertFalse(p["production_authorized"])
    def test_default_kill_switch(self):
        with self.assertRaises(ContractError):
            plan_proposal(task(),(model(),),allowed_routes=ROUTES)
    def test_explicit_test_approval_required(self):
        with self.assertRaises(ContractError):
            plan_proposal(task(),(model(),),allowed_routes=ROUTES,kill_switch=False)
    def test_wrong_agent_denied(self):
        with self.assertRaises(ContractError):plan(task(agent_id="NCA-999"))
    def test_wrong_tenant_denied(self):
        with self.assertRaises(ContractError):plan(task(tenant_id="tenant-other"))
    def test_wrong_orchestrator_denied(self):
        with self.assertRaises(ContractError):plan(task(orchestrator_id="orchestrator-b"))
    def test_payment_skill_denied(self):
        with self.assertRaises(ContractError):task(capability="execute:payment")
    def test_private_data_denied(self):
        with self.assertRaises(ContractError):task(data_class="PRIVATE_CLIENT")
    def test_wrong_mode_denied(self):
        with self.assertRaises(ContractError):task(mode="NEW_MODEL_MAX")
    def test_positive_budget_denied(self):
        with self.assertRaises(ContractError):task(budget_cents=1)
    def test_boolean_budget_denied(self):
        with self.assertRaises(ContractError):task(budget_cents=False)
    def test_side_effects_denied(self):
        with self.assertRaises(ContractError):task(external_effects=True)
    def test_execution_request_denied(self):
        with self.assertRaises(ContractError):task(action="EXECUTE")
    def test_invalid_input_sha_denied(self):
        with self.assertRaises(ContractError):task(input_sha256="bad")
    def test_invalid_model_sha_denied(self):
        with self.assertRaises(ContractError):model(verified_digest="bad")
    def test_unhealthy_model_denied(self):
        with self.assertRaises(ContractError):plan(ms=(model(healthy=False),))
    def test_paid_model_denied(self):
        with self.assertRaises(ContractError):plan(ms=(model(free_only=False),))
    def test_remote_denied_by_default(self):
        with self.assertRaises(ContractError):plan(ms=(model(local=False),))
    def test_remote_explicit_does_not_execute(self):
        self.assertFalse(plan(ms=(model(local=False),),allow_remote=True)["execution_authorized"])
    def test_incompatible_skill_denied(self):
        with self.assertRaises(ContractError):plan(ms=(model(capabilities=("text:analyze",)),))
    def test_max_requires_capable_model(self):
        with self.assertRaises(ContractError):
            plan(task(mode="MAX"),ms=(model(supports_max=False),))
    def test_duplicate_model_denied(self):
        with self.assertRaises(ContractError):plan(ms=(model(),model()))
    def test_priority_selection(self):
        a=model(model_id="model-002",priority=9)
        b=model(priority=1)
        self.assertEqual(plan(ms=(a,b))["model_id"],"model-001")
    def test_fallback_skips_unhealthy(self):
        a=model(priority=0,healthy=False)
        b=model(model_id="model-002",priority=2)
        self.assertEqual(plan(ms=(a,b))["model_id"],"model-002")
    def test_immutable_task(self):
        with self.assertRaises(dataclasses.FrozenInstanceError):
            task().mode="MAX"
    def test_boolean_health_rejected(self):
        with self.assertRaises(ContractError):model(healthy=1)
    def test_route_list_rejected(self):
        with self.assertRaises(ContractError):
            plan_proposal(task(),(model(),),allowed_routes=set(ROUTES),
                          kill_switch=False,synthetic_approval=True)

if __name__=="__main__":unittest.main()
