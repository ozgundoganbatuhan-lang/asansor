import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type WorkOrderEvidence = {
  startedAt?: string | null;
  endedAt?: string | null;
  serviceOutcome?: string | null;
  summary?: string | null;
  signoffName?: string | null;
  customerContact?: string | null;
  locationNote?: string | null;
  signatureDataUrl?: string | null;
};

function evidencePath(orgId: string, workOrderId: string) {
  return path.join(process.cwd(), "public", "uploads", "work-orders", orgId, workOrderId, "evidence.json");
}

export async function readWorkOrderEvidence(orgId: string, workOrderId: string): Promise<WorkOrderEvidence> {
  const filePath = evidencePath(orgId, workOrderId);
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as WorkOrderEvidence;
  } catch {
    return {};
  }
}

export async function writeWorkOrderEvidence(orgId: string, workOrderId: string, evidence: WorkOrderEvidence) {
  const filePath = evidencePath(orgId, workOrderId);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(evidence, null, 2), "utf8");
  return evidence;
}
