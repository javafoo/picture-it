/* The places a look can be shot, and the photo of the model the piece is put
   on. Pure: the job reads these, and the page shows the labels.

   The try-on needs one person, standing, facing the camera, with her body in
   view (docs.perfectcorp.com, AI Clothes: "error_pose" otherwise). So the
   model is always photographed that way, in a plain fitted tee, slim jeans and
   white sneakers: clothes that any top, dress, jacket or pair of trousers can
   replace cleanly. */

export const SCENES = {
  street: { label: "Street", where: "on a city sidewalk outside a café, in soft daylight" },
  studio: { label: "Studio", where: "against a plain warm-white studio wall, in soft window light" },
  golden: { label: "Golden hour", where: "on a quiet tree-lined street at golden hour" },
  cafe: { label: "Café", where: "inside a bright café, standing by the window" },
  beach: { label: "Boardwalk", where: "on a wooden boardwalk by the sea, in soft afternoon light" },
  home: { label: "At home", where: "in a bright, minimal living room with plants" },
} as const;

export type SceneKey = keyof typeof SCENES;

export const SCENE_KEYS = Object.keys(SCENES) as SceneKey[];

/** A form value as a scene, or null when it is not one. */
export function sceneKey(value: unknown): SceneKey | null {
  return SCENE_KEYS.find((key) => key === value) ?? null;
}

/** How many looks one press of the button makes. */
export const MAX_LOOKS_PER_SHOOT = 3;

export const MAX_PLACE_CHARS = 120;

/** A place the seller typed, tidied, or null when there is no usable place in it. */
export function typedPlace(value: unknown): string | null {
  const place = String(value ?? "").replace(/\s+/g, " ").trim();
  return place.length >= 3 && place.length <= MAX_PLACE_CHARS ? place : null;
}

/** The idea for the photo the piece is put on: at one of our scenes, or a place she typed. */
export function modelPhotoIdea(at: { scene: SceneKey } | { place: string }): string {
  const where = "scene" in at ? SCENES[at.scene].where : `in this place: ${at.place}`;
  return [
    `She stands relaxed with her weight on one leg, facing the camera with a soft natural smile, full length from head to toe, arms loose at her sides, ${where}.`,
    "She wears a plain fitted white T-shirt, slim light-blue jeans and white sneakers.",
    "Her whole body is in the frame and she fills most of it. Nobody else is in the photo.",
  ].join(" ");
}
