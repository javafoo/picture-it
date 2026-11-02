/* The setup steps, in one place. The Overview lists them in full, the
   sidebar and the phone's bottom bar mark them with dots, and the
   banner that says "you are set up" fires when they are done. Each view
   used to compute its own version of "done", which is how they drift. */

export type SetupCounts = {
  profileComplete: boolean;
  keyword?: string | null;
  references: number;
};

export type SetupStep = {
  href: string;
  title: string;
  body: string;
  todo: string;
  done: boolean;
  status: string;
};

export function setupSteps(c: SetupCounts): SetupStep[] {
  return [
    {
      href: "/brand",
      title: "Brand",
      body: "Who buys from you, what you sell, the word people comment.",
      todo: "Tell the writer about your shop",
      done: c.profileComplete,
      status: c.profileComplete ? `Keyword ${c.keyword ?? ""}`.trim() : "Not set up",
    },
    {
      href: "/avatar",
      title: "Model",
      body: "The reference photos that keep her face the same everywhere.",
      todo: "Add real photos so her face stays hers",
      done: c.references > 0,
      status: c.references ? `${c.references} reference photos` : "No photos yet",
    },
  ];
}

/** All done. From here the numbers and dots have nothing left to say. */
export const setupComplete = (steps: SetupStep[]): boolean => steps.every((step) => step.done);
