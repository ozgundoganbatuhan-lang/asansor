import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";

export type AssetToken = { assetId: string; orgId: string; iat?: number; exp?: number };

export function signAssetShareToken(assetId: string, orgId: string) {
  return jwt.sign({ assetId, orgId } satisfies AssetToken, JWT_SECRET, { expiresIn: "365d" });
}

export function verifyAssetShareToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as AssetToken;
  } catch {
    return null;
  }
}
