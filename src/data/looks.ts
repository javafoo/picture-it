import { listMedia, type Media } from "./media";

/* The Studio's two shelves: the pieces she uploaded from her shop, and the
   looks made from them. Both are ordinary media rows, told apart by meta. */

export type PieceMeta = { name: string; category: string };
export type LookMeta = { garmentMediaId: string; modelMediaId: string | null; category: string; scene?: string };

export function pieceOf(row: Pick<Media, "meta">): PieceMeta | null {
  const piece = (row.meta as { piece?: unknown } | null)?.piece as Partial<PieceMeta> | undefined;
  return piece && typeof piece.name === "string" && typeof piece.category === "string" ? { name: piece.name, category: piece.category } : null;
}

export function lookOf(row: Pick<Media, "meta">): LookMeta | null {
  const meta = (row.meta ?? {}) as Record<string, unknown>;
  if (meta.source !== "tryon" || typeof meta.garmentMediaId !== "string") return null;
  return {
    garmentMediaId: meta.garmentMediaId,
    modelMediaId: typeof meta.modelMediaId === "string" ? meta.modelMediaId : null,
    category: typeof meta.category === "string" ? meta.category : "auto",
    ...(typeof meta.scene === "string" ? { scene: meta.scene } : {}),
  };
}

/** Her pieces and looks on this avatar, newest first. */
export async function studioShelves(userId: string, avatarId: string) {
  const rows = await listMedia(userId, "image", { avatarId, keptOnly: true, limit: 300 });
  const pieces = rows.flatMap((row) => {
    const piece = pieceOf(row);
    return piece ? [{ id: row.id, ...piece }] : [];
  });
  const looks = rows.flatMap((row) => {
    const look = lookOf(row);
    return look ? [{ id: row.id, createdAt: row.createdAt.toISOString(), ...look }] : [];
  });
  // Photos of her she could be dressed in: kept, not a piece, not already a look.
  const models = rows.filter((row) => !pieceOf(row) && !lookOf(row) && (row.meta as { subject?: unknown }).subject !== "scene").slice(0, 24).map((row) => row.id);
  return { pieces, looks, models };
}

export type StudioShelves = Awaited<ReturnType<typeof studioShelves>>;
