/// Nano Core Agent (NCA) Execution Reference Implementation
///
/// REFERENCE_IMPLEMENTATION != PRODUCTION_VELION_RUNTIME
///
/// This module demonstrates the public VELION NCA governance model:
///
/// IDENTITY → CAPABILITY → TASK → POLICY → EXECUTION → EVIDENCE
///
/// Canonical security laws:
/// - Identity != Authority
/// - Capability != Approval
/// - Intelligence != Privilege
/// - DENY BY DEFAULT

import { crypto } from "std/crypto/mod.ts";

/// SHA-256 hash function using Web Crypto API
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/// NCA Identity structure
export interface NCAIdentity {
  ncaId: string;
  ncaClass: string;
  role: string;
  domain: string;
  orchestrator: string;
  runtimeDomain: string;
  capabilitySet: string[];
  policyProfile: string;
  missionId: string;
  taskId: string;
  executionState: string;
  modelProvider: string;
  memoryScope: string;
  approvalScope: string;
  evidenceState: string;
  createdAt: string;
  lastExecutionAt: string;
}

/// NCA Capability - what an NCA is allowed to do
export interface Capability {
  name: string;
  scope: string;
  grantedAt: string;
}

/// Execution Task envelope
export interface TaskEnvelope {
  missionId: string;
  taskId: string;
  ncaId: string;
  requestedCapability: string;
  requestedAction: string;
  inputScope: string;
  outputScope: string;
  policyProfile: string;
  approvalRequired: boolean;
  allowedRuntime: number; // milliseconds
  allowedProvider: string;
  networkPolicy: string;
  resourceBudget: number;
  timeout: number; // milliseconds
  evidenceRequired: boolean;
  expiration: string;
  revocationState: string;
}

/// Task input for execution
export interface TaskInput {
  data: Record<string, unknown>;
}

/// Execution result with evidence
export interface ExecutionResult {
  taskId: string;
  ncaId: string;
  decision: "ALLOW" | "DENY";
  requestedCapability: string;
  inputSha256: string;
  outputSha256?: string;
  timestamp: string;
  truthBoundary: string;
  denyReason?: string;
  executionTimeMs?: number;
  outputData?: Record<string, unknown>;
}

/// VELION Reference Execution Engine
export class VelionReferenceExecutor {
  private registeredNcas: Map<string, NCAIdentity> = new Map();
  private grantedCapabilities: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // No default capabilities are granted.
    // DENY BY DEFAULT
  }

  /// Register an NCA with identity validation
  registerNCA(identity: NCAIdentity): void {
    if (!this.validateNCAIdentity(identity)) {
      throw new Error(`Invalid NCA identity: ${identity.ncaId}`);
    }
    this.registeredNcas.set(identity.ncaId, identity);
    this.grantedCapabilities.set(identity.ncaId, new Set());
  }

  /// Validate NCA identity
  private validateNCAIdentity(identity: NCAIdentity): boolean {
    if (!identity.ncaId || identity.ncaId.trim() === "") return false;
    if (!identity.ncaClass || identity.ncaClass.trim() === "") return false;
    if (!identity.role || identity.role.trim() === "") return false;
    if (!identity.missionId || identity.missionId.trim() === "") return false;
    if (!Array.isArray(identity.capabilitySet)) return false;
    if (!identity.executionState || identity.executionState.trim() === "") {
      return false;
    }
    return true;
  }

  /// Grant a capability to an NCA (explicit authorization required)
  grantCapability(ncaId: string, capabilityName: string): void {
    if (!this.registeredNcas.has(ncaId)) {
      throw new Error(`NCA not registered: ${ncaId}`);
    }
    const capabilities = this.grantedCapabilities.get(ncaId);
    if (capabilities) {
      capabilities.add(capabilityName);
    }
  }

  /// Revoke a capability from an NCA
  revokeCapability(ncaId: string, capabilityName: string): void {
    const capabilities = this.grantedCapabilities.get(ncaId);
    if (capabilities) {
      capabilities.delete(capabilityName);
    }
  }

  /// Check if an NCA has a granted capability
  hasCapability(ncaId: string, capabilityName: string): boolean {
    const capabilities = this.grantedCapabilities.get(ncaId);
    return capabilities ? capabilities.has(capabilityName) : false;
  }

  /// Main execution gate
  /// Returns ALLOW/DENY decision with evidence
  async execute(
    envelope: TaskEnvelope,
    input: TaskInput
  ): Promise<ExecutionResult> {
    const timestamp = new Date().toISOString();
    const inputSha256 = await sha256(JSON.stringify(input));

    // Step 1: Identity validation
    const nca = this.registeredNcas.get(envelope.ncaId);
    if (!nca) {
      return {
        taskId: envelope.taskId,
        ncaId: envelope.ncaId,
        decision: "DENY",
        requestedCapability: envelope.requestedCapability,
        inputSha256,
        timestamp,
        truthBoundary: "REFERENCE_IMPLEMENTATION",
        denyReason: "NCA_IDENTITY_NOT_FOUND",
      };
    }

    // Step 2: NCA state validation
    if (nca.executionState === "QUARANTINED" || nca.revocationState === "REVOKED") {
      return {
        taskId: envelope.taskId,
        ncaId: envelope.ncaId,
        decision: "DENY",
        requestedCapability: envelope.requestedCapability,
        inputSha256,
        timestamp,
        truthBoundary: "REFERENCE_IMPLEMENTATION",
        denyReason: "NCA_QUARANTINED_OR_REVOKED",
      };
    }

    // Step 3: Capability authorization (DENY BY DEFAULT)
    const hasCapability = this.hasCapability(
      envelope.ncaId,
      envelope.requestedCapability
    );
    if (!hasCapability) {
      return {
        taskId: envelope.taskId,
        ncaId: envelope.ncaId,
        decision: "DENY",
        requestedCapability: envelope.requestedCapability,
        inputSha256,
        timestamp,
        truthBoundary: "REFERENCE_IMPLEMENTATION",
        denyReason: "CAPABILITY_NOT_GRANTED",
      };
    }

    // Step 4: Task envelope validation
    if (!this.validateTaskEnvelope(envelope)) {
      return {
        taskId: envelope.taskId,
        ncaId: envelope.ncaId,
        decision: "DENY",
        requestedCapability: envelope.requestedCapability,
        inputSha256,
        timestamp,
        truthBoundary: "REFERENCE_IMPLEMENTATION",
        denyReason: "INVALID_TASK_ENVELOPE",
      };
    }

    // Step 5: Policy enforcement
    if (envelope.revocationState === "REVOKED") {
      return {
        taskId: envelope.taskId,
        ncaId: envelope.ncaId,
        decision: "DENY",
        requestedCapability: envelope.requestedCapability,
        inputSha256,
        timestamp,
        truthBoundary: "REFERENCE_IMPLEMENTATION",
        denyReason: "TASK_REVOKED",
      };
    }

    // Step 6: Deterministic reference execution
    const executionStart = performance.now();
    let outputData: Record<string, unknown> = {};
    try {
      outputData = await this.executeTask(input, envelope.requestedAction);
    } catch (error) {
      return {
        taskId: envelope.taskId,
        ncaId: envelope.ncaId,
        decision: "DENY",
        requestedCapability: envelope.requestedCapability,
        inputSha256,
        timestamp,
        truthBoundary: "REFERENCE_IMPLEMENTATION",
        denyReason: `EXECUTION_ERROR: ${String(error)}`,
      };
    }
    const executionTimeMs = performance.now() - executionStart;

    // Step 7: Generate evidence
    const outputSha256 = await sha256(JSON.stringify(outputData));

    // Step 8: Return ALLOW result with evidence
    return {
      taskId: envelope.taskId,
      ncaId: envelope.ncaId,
      decision: "ALLOW",
      requestedCapability: envelope.requestedCapability,
      inputSha256,
      outputSha256,
      timestamp,
      truthBoundary: "REFERENCE_IMPLEMENTATION",
      executionTimeMs,
      outputData,
    };
  }

  private validateTaskEnvelope(envelope: TaskEnvelope): boolean {
    if (!envelope.taskId || envelope.taskId.trim() === "") return false;
    if (!envelope.ncaId || envelope.ncaId.trim() === "") return false;
    if (!envelope.requestedCapability || envelope.requestedCapability.trim() === "") {
      return false;
    }
    if (envelope.timeout <= 0) return false;
    return true;
  }

  private async executeTask(
    input: TaskInput,
    action: string
  ): Promise<Record<string, unknown>> {
    // Reference implementation: echo task with metadata
    return {
      action,
      inputReceived: input,
      processingComplete: true,
      referenceImplementation: true,
      executedAt: new Date().toISOString(),
    };
  }

  /// Get registered NCA (for testing)
  getNCA(ncaId: string): NCAIdentity | undefined {
    return this.registeredNcas.get(ncaId);
  }

  /// Get all granted capabilities for an NCA (for testing)
  getCapabilities(ncaId: string): string[] {
    const caps = this.grantedCapabilities.get(ncaId);
    return caps ? Array.from(caps) : [];
  }
}

/// Factory for creating test NCAs
export function createTestNCA(id: string, capabilities: string[] = []): NCAIdentity {
  return {
    ncaId: id,
    ncaClass: "S1_MICRO_TEAM",
    role: "EXECUTOR",
    domain: "PUBLIC_REFERENCE",
    orchestrator: "LOCAL_TEST",
    runtimeDomain: "LOCAL_REFERENCE",
    capabilitySet: capabilities,
    policyProfile: "REFERENCE_POLICY",
    missionId: "TEST_MISSION_001",
    taskId: "TEST_TASK_SEED",
    executionState: "READY",
    modelProvider: "LOCAL_REFERENCE",
    memoryScope: "LOCAL",
    approvalScope: "LOCAL",
    evidenceState: "PENDING",
    createdAt: new Date().toISOString(),
    lastExecutionAt: new Date().toISOString(),
  };
}
