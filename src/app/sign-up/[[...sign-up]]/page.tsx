import { SignUp } from "@clerk/nextjs";

import { AuthFrame } from "@/components/auth-frame";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/product";

export const metadata = { title: `Create an account · ${PRODUCT_NAME}` };

export default function SignUpPage() {
  return (
    <AuthFrame
      headline={PRODUCT_TAGLINE}
      lead="Set up your model once, from photos or from a description. Add a product photo and get looks in about a minute each."
    >
      <SignUp />
    </AuthFrame>
  );
}
