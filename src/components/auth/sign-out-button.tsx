"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { t } from "@/i18n";

/** Shown in the header only while someone is signed in. */
export function SignOutButton() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  if (!session) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="font-sans text-sm font-medium"
    >
      {t("login.signOut")}
    </button>
  );
}
