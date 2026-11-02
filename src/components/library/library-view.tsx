import { Gallery, type GalleryItem } from "@/components/library/gallery";
import { LibraryTabs } from "@/components/library/tabs";
import { EmptyState, PageHeader } from "@/components/ui";
import { CLIP_MODELS } from "@/content/clip-options";
import { listAvatars } from "@/data/avatars";
import { folderChoice, folderCounts, listFolders, totalOf } from "@/data/folders";
import { listMedia, mediaUrl, SHOW_ALL, UPLOAD_CAP, type Media } from "@/data/media";
import { requireUser } from "@/data/users";
import { currentAvatar } from "@/lib/current-avatar";
import { isFavorite } from "@/lib/tile-actions";
import { canCopy } from "@/lib/uploads";

import type { LibraryTab } from "./paths";
import { photosFor, photoShelf, SHELF_LABEL, shelfCounts, shelfFrom } from "./shelves";

/* One page, two tabs: what she made in the Studio, to look at and download.
 *
 * The tab is the kind — photos or clips — and the folder rides along in the
 * URL across the switch, so "Beach day" open on Photos is still open on
 * Clips. Both tabs are drawn by this one component so the header, the tabs,
 * the folder row and the grid can never drift apart; the routes under
 * src/app/library only say which tab they are. */

const MODEL_NAME: Record<string, string> = Object.fromEntries(CLIP_MODELS.map((model) => [model.id, model.name]));

/** The row, said in the words the grid and the viewer show. Also drawn by the Favorites tab. */
export function toGalleryItem(row: Media): GalleryItem {
  const meta = row.meta as { idea?: string; motion?: string; originalName?: string; source?: string; model?: string; subject?: string };
  const uploaded = meta.source === "upload";
  const title = row.kind === "image"
    ? (uploaded ? meta.originalName ?? "" : meta.idea ?? "")
    : (uploaded ? meta.originalName ?? "" : meta.motion ?? "");
  return {
    id: row.id,
    kind: row.kind === "image" ? "image" : "clip",
    src: mediaUrl(row.id),
    createdAt: row.createdAt.toISOString(),
    folderId: row.folderId,
    title,
    uploaded,
    scene: uploaded && meta.subject === "scene",
    words: row.kind === "image" && photoShelf(row.meta) === "words",
    model: !uploaded && meta.model ? MODEL_NAME[meta.model] ?? meta.model : undefined,
    seconds: row.durationSeconds == null ? null : Number(row.durationSeconds),
    favorite: isFavorite(row.meta),
    avatarId: row.avatarId,
    copyable: canCopy(row),
  };
}

export async function LibraryView({
  tab,
  searchParams,
}: {
  tab: LibraryTab;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => (Array.isArray(params[key]) ? params[key][0] : params[key]);

  const user = await requireUser();
  const kind = tab === "photos" ? "image" : "clip";
  // A shelf is a Photos view only; on Clips the parameter means nothing.
  const shelf = tab === "photos" ? shelfFrom(one("shelf")) : null;

  /* A folder id in the URL that is not this account's is treated as "all":
     a stale bookmark should show the library, not an error page. */
  const folders = await listFolders(user.id);
  let folderParam = one("folder");
  let folder: string | null | undefined;
  try {
    folder = folderChoice(folderParam);
  } catch {
    folder = undefined;
  }
  if (typeof folder === "string" && !folders.some((item) => item.id === folder)) folder = undefined;
  // A shelf holds its photos from every folder, so an open shelf has no folder open.
  if (shelf) folder = undefined;
  if (folder === undefined) folderParam = undefined;

  const avatar = await currentAvatar(user.id);
  /* Every item is read, and photos are sorted into shelves here, because
     which shelf a photo is on is worked out from the photo. The grid and the
     counts on the chips come from the same rows. */
  /* Counts are this avatar's, like the grid: the tabs once said "Photos 36"
     over a grid of five, counting every avatar on the account. The account's
     own counts are read too, only to tell an empty folder from one that holds
     another avatar's things. */
  const [listed, counts, avatars] = await Promise.all([
    listMedia(user.id, kind, { folder: tab === "photos" ? undefined : folder, keptOnly: true, avatarId: avatar?.id, orUnassigned: true, limit: SHOW_ALL }),
    folderCounts(user.id, undefined, avatar?.id),
    listAvatars(user.id),
  ]);
  const items = tab === "photos" ? photosFor(listed, { shelf, folder }) : listed;
  const shelved = tab === "photos" ? shelfCounts(listed) : null;

  const totals = { photos: totalOf(counts, "image"), videos: totalOf(counts, "clip") };
  const inFolder = folder === null ? " not in a folder" : " in this folder";

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Everything you have made"
      />

      <LibraryTabs tab={tab} folder={folderParam} counts={shelved ? { ...totals, photos: shelved.made } : totals} />
      {items.length === 0 ? (
        shelf ? (
          <EmptyState title={`Nothing in ${SHELF_LABEL[shelf].name} yet`}>{SHELF_LABEL[shelf].empty}</EmptyState>
        ) : tab === "photos" ? (
          <EmptyState title={folder === undefined ? "No photos yet" : `No photos${inFolder}`}>
            {folder === undefined
              ? "Looks you make in the Studio land here."
              : "Use Select on another folder to move photos in."}
          </EmptyState>
        ) : (
          <EmptyState title={folder === undefined ? "No videos yet" : `No videos${inFolder}`}>
            {folder === undefined
              ? "Press Animate for Reels on a look in the Studio and the video lands here."
              : "Use Select on another folder to move videos in."}
          </EmptyState>
        )
      ) : (
        <Gallery
          items={items.map(toGalleryItem)}
          folders={folders.map(({ id, name }) => ({ id, name }))}
          kind={kind}
          folder={folderParam}
          copy={{ avatars: avatars.map(({ id, name }) => ({ id, name })), cap: UPLOAD_CAP }}
        />
      )}
    </>
  );
}
