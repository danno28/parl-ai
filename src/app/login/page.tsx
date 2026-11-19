import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { t } from "@/i18n";

export default function LoginPage() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
        <span className="label-caps">{t("login.label")}</span>
        {/* The form reads ?next= and ?error= from the URL, so it renders on the client. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
