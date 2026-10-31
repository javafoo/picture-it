/* Casting a model from a description, for a seller with no photos of anyone.

   One portrait is made from her words, then the other shots are made from that
   portrait so the face holds. They land as ordinary setup photos, screened and
   described like uploaded ones, so nothing after this step knows the
   difference. The shots repeat what worked when tested: a plain portrait, an
   angle, a full length, and two everyday ones. Pure. */

export const CAST_SHOTS = [
  "A natural phone photo, head and shoulders, facing the camera with a soft smile, in a plain cream top, in soft window light against a plain light wall.",
  "A natural phone photo from the waist up, turned three-quarters to the left and looking at the camera, in a plain grey T-shirt, outdoors in soft shade.",
  "A full-length phone photo, standing and facing the camera, arms relaxed, in a plain white T-shirt, slim light-blue jeans and white sneakers, against a plain light wall, the whole body in frame.",
  "A candid phone photo from the chest up, laughing and looking slightly away from the camera, in a plain navy sweater, in a bright kitchen.",
  "A natural phone photo from the waist up, seated at a café table and looking at the camera, in a plain black top, in daylight from a window.",
] as const;

const FINISH = "Real skin texture, no retouching, no text, no logos.";

export const MIN_DESCRIPTION = 12;
export const MAX_DESCRIPTION = 400;

/** The description, tidied, or null when it is too short to make someone from. */
export function castDescription(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return text.length >= MIN_DESCRIPTION ? text.slice(0, MAX_DESCRIPTION) : null;
}

/** The prompt for one shot. Shot 0 comes from the words; the rest also carry shot 0 as their reference. */
export function castPrompt(description: string, index: number): string {
  const shot = CAST_SHOTS[index];
  if (index === 0) return `${shot} The person is an adult, invented for this photo, and looks like no real or famous person: ${description}. ${FINISH}`;
  return `The same adult as in the attached photo: same face, same hair, same features. ${shot} ${FINISH}`;
}
