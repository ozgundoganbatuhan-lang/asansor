import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type WorkOrderAttachment = {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
};

type Manifest = { items: WorkOrderAttachment[] };

function slugifyFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function attachmentDir(orgId: string, workOrderId: string) {
  return path.join(process.cwd(), "public", "uploads", "work-orders", orgId, workOrderId);
}

async function ensureManifest(orgId: string, workOrderId: string) {
  const dir = attachmentDir(orgId, workOrderId);
  await mkdir(dir, { recursive: true });
  const manifestPath = path.join(dir, "manifest.json");
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as Manifest;
    return { dir, manifestPath, manifest: parsed };
  } catch {
    const manifest: Manifest = { items: [] };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    return { dir, manifestPath, manifest };
  }
}

export async function listWorkOrderAttachments(orgId: string, workOrderId: string) {
  const { manifest } = await ensureManifest(orgId, workOrderId);
  return manifest.items.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export async function createWorkOrderAttachment(params: {
  orgId: string;
  workOrderId: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}) {
  const { dir, manifestPath, manifest } = await ensureManifest(params.orgId, params.workOrderId);
  const extension = path.extname(params.originalName) || (params.mimeType.includes("png") ? ".png" : ".jpg");
  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${slugifyFileName(path.basename(params.originalName, extension))}${extension}`;
  const absolutePath = path.join(dir, fileName);
  await writeFile(absolutePath, params.buffer);
  const url = `/uploads/work-orders/${params.orgId}/${params.workOrderId}/${fileName}`;
  const item: WorkOrderAttachment = {
    id: randomUUID(),
    fileName,
    originalName: params.originalName,
    mimeType: params.mimeType,
    size: params.buffer.byteLength,
    url,
    uploadedAt: new Date().toISOString(),
  };
  manifest.items.push(item);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  return item;
}
