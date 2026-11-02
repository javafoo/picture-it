import { redirect } from "next/navigation";

// Your week is not part of Picture It: an old link lands on the Studio.
export default function WeekPage() {
  redirect("/studio");
}
