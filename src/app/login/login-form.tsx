"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { t } from "@/i18n";

type State =
  | { step: "form"; error?: string }
  | { step: "sending" }
  | { step: "sent"; email: string; devLink?: string };

/** Only allow redirects to paths inside this app. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function LoginForm() {
  const params = useSearchParams();
  const callbackURL = safeNext(params.get("next"));
  const [state, setState] = useState<State>(() =>
    params.get("error") ? { step: "form", error: t("login.linkExpired") } : { step: "form" },
  );
  const [email, setEmail] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ step: "sending" });
    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL,
      errorCallbackURL: "/login",
    });
    if (!error) {
      // Local development without an email service: the server hands the link over directly.
      const dev = await fetch(`/api/dev/login-link?email=${encodeURIComponent(email.trim())}`)
        .then((r) => (r.ok ? (r.json() as Promise<{ url: string }>) : null))
        .catch(() => null);
      return setState({ step: "sent", email: email.trim(), devLink: dev?.url });
    }
    setState({
      step: "form",
      error: error.status === 403 ? t("login.notInvited") : t("login.failed"),
    });
  }

  if (state.step === "sent" && state.devLink) {
    return (
      <div className="mt-10 grid gap-5">
        <h1 className="text-[clamp(2.25rem,6vw,4rem)] leading-[1.05] italic">{t("login.devTitle")}</h1>
        <p className="font-sans text-sm text-muted-foreground">{t("login.devBody")}</p>
        <a
          href={state.devLink}
          className="justify-self-start rounded-full bg-foreground px-6 py-3 font-sans text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {t("login.devSignIn")}
        </a>
      </div>
    );
  }

  if (state.step === "sent") {
    return (
      <div className="mt-10 grid gap-5">
        <h1 className="text-[clamp(2.25rem,6vw,4rem)] leading-[1.05] italic">{t("login.sentTitle")}</h1>
        <p className="font-sans text-sm text-muted-foreground">
          {t("login.sentBody").replace("{email}", state.email)}
        </p>
        <button
          type="button"
          onClick={() => setState({ step: "form" })}
          className="justify-self-start border-b pb-0.5 font-sans text-sm font-medium hover:border-foreground"
        >
          {t("login.otherEmail")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-10 grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-[clamp(2.25rem,6vw,4rem)] leading-[1.05] italic">{t("login.title")}</h1>
        <p className="font-sans text-sm text-muted-foreground">{t("login.subtitle")}</p>
      </div>
      <label className="grid gap-2">
        <span className="label-caps">{t("login.email")}</span>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-none border-0 border-b border-foreground bg-transparent py-2 text-2xl focus:border-b-2 focus:outline-none"
        />
      </label>
      {state.step === "form" && state.error && (
        <p role="alert" className="font-sans text-sm text-live">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={state.step === "sending"}
        className="justify-self-start rounded-full bg-foreground px-6 py-3 font-sans text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {state.step === "sending" ? t("login.sending") : t("login.submit")}
      </button>
    </form>
  );
}
