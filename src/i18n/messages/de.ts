/**
 * German UI strings (v1 interface language, U-7).
 * Every user-facing string lives in a messages file, so other native languages
 * can be added later by adding a file with the same keys (§9).
 */
export const de = {
  app: {
    description: "Französisch lernen in echten Alltagsszenen.",
  },
  nav: {
    demo: "Demo",
  },
  theme: {
    dark: "Dunkel",
    light: "Hell",
  },
  home: {
    label: "Szene wählen",
    questionDe: "Wohin geht's heute?",
    start: "Beginnen →",
    ownScenario: "Oder eigene Szene beschreiben …",
    otherSuggestions: "Andere Vorschläge",
    uploadVocab: "Vokabelliste hochladen",
    grammar: "Grammatik",
    change: "ändern",
    length: "Dauer",
    minutes: "Min.",
  },
  conversation: {
    reading: "Lesen",
    speaking: "Sprechen",
    youRead: "Du liest vor",
    replay: "Nochmal",
    slow: "Langsam",
    translate: "Übersetzen",
    hide: "Ausblenden",
    tapToSpeak: "Tippen zum Sprechen",
    listening: "Hört zu … tippen zum Beenden",
    evaluating: "Wird ausgewertet …",
    tryAgain: "Tippen und nochmal versuchen",
    startRecording: "Aufnahme starten",
    stopRecording: "Aufnahme beenden",
    speakerHint: "Antippen zum Wiederholen",
  },
  demo: {
    note: "Demo mit Beispielinhalt. Mikrofon und Bewertung sind noch simuliert.",
  },
} as const;

export type Messages = typeof de;
