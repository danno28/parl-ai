import { de, type Messages } from "./messages/de";

/** Native (UI) languages available. v1 ships German only (U-7); add more files later (§9). */
const catalogs = { de } satisfies Record<string, Messages>;

export type UiLanguage = keyof typeof catalogs;
export const DEFAULT_UI_LANGUAGE: UiLanguage = "de";

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;
type Paths<T> = {
  [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T];

export type MessageKey = Paths<Messages>;

/** Look up a UI string by dot path, e.g. t("home.start"). Keys are type-checked. */
export function t(key: MessageKey, lang: UiLanguage = DEFAULT_UI_LANGUAGE): string {
  let node: unknown = catalogs[lang];
  for (const part of key.split(".")) {
    node = (node as Record<string, unknown>)[part];
  }
  return node as string;
}
