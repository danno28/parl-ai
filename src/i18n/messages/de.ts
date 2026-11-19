/**
 * German UI strings (v1 interface language, U-7).
 * Every user-facing string lives in a messages file, so other native languages
 * can be added later by adding a file with the same keys (§9).
 */
export const de = {
  app: {
    description: "Erst sprechen, dann lernen. Französisch in echten Alltagsszenen.",
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
    noteSimulated:
      "Demo mit Beispielinhalt. Azure Speech ist nicht eingerichtet, deshalb sind Stimme und Bewertung simuliert.",
    noteLive: "Demo mit Beispielinhalt. Stimme und Aussprachebewertung laufen über Azure Speech.",
    micDenied: "Kein Zugriff aufs Mikrofon. Bitte im Browser erlauben und nochmal versuchen.",
    tooShort: "Nichts erkannt. Bitte etwas lauter und deutlicher sprechen.",
    failed: "Die Bewertung hat nicht geklappt. Bitte nochmal versuchen.",
  },
  login: {
    label: "Anmelden",
    title: "Bon retour.",
    subtitle: "Melde dich mit deiner E-Mail-Adresse an. Wir schicken dir einen Link.",
    email: "E-Mail-Adresse",
    submit: "Link senden",
    sending: "Wird gesendet …",
    sentTitle: "Schau in dein Postfach.",
    sentBody: "Wir haben einen Anmeldelink an {email} geschickt. Er ist 15 Minuten gültig.",
    otherEmail: "Andere E-Mail-Adresse",
    notInvited: "Diese E-Mail-Adresse ist nicht eingeladen. parl.ai ist im Moment nur auf Einladung nutzbar.",
    failed: "Das hat nicht geklappt. Bitte nochmal versuchen.",
    linkExpired: "Der Link ist abgelaufen oder wurde schon benutzt. Fordere einfach einen neuen an.",
    signOut: "Abmelden",
    devTitle: "Bienvenue.",
    devBody:
      "Lokaler Entwicklungsmodus ohne E-Mail-Versand: Dein Anmeldelink steht hier statt in deinem Postfach.",
    devSignIn: "Jetzt anmelden",
  },
} as const;

export type Messages = typeof de;
