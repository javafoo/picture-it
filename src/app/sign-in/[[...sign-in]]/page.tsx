import { SignIn } from "@clerk/nextjs";

import { AuthFrame } from "@/components/auth-frame";
import { PRODUCT_NAME } from "@/lib/product";

export const metadata = { title: `Sign in · ${PRODUCT_NAME}` };

export default function SignInPage() {
  return (
    <AuthFrame
      headline="Get more customers from social media, without spending hours creating content."
      lead="Your real product photos, on your model, in the places you choose. No photoshoot."
    >
      <SignIn />
    </AuthFrame>
  );
}
