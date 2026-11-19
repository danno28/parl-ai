import type { LessonContent } from "@/lib/schemas/lesson";

/**
 * A hand-written A2 lesson for local development only, so the lesson flow can be tried
 * before a Claude API key is set up. Never offered in production builds.
 */
export const SAMPLE_LESSON: LessonContent = {
  scenarioTitleTarget: "À la boulangerie",
  scenarioTitleNative: "In der Bäckerei",
  partnerName: "Camille",
  partnerRole: "boulangère",
  userRole: "Kundin",
  register: "formal",
  vocabulary: [
    { termTarget: "la baguette", termNative: "das Baguette", partOfSpeech: "noun", gender: "none", example: "Je voudrais une baguette.", note: "" },
    { termTarget: "le croissant", termNative: "das Croissant", partOfSpeech: "noun", gender: "none", example: "Deux croissants, s'il vous plaît.", note: "" },
    { termTarget: "le pain complet", termNative: "das Vollkornbrot", partOfSpeech: "noun", gender: "none", example: "Vous avez aussi du pain complet ?", note: "" },
    { termTarget: "je voudrais …", termNative: "ich hätte gern …", partOfSpeech: "phrase", gender: "none", example: "Je voudrais une baguette.", note: "Höfliche Form von « je veux »." },
    { termTarget: "avec ceci ?", termNative: "sonst noch etwas?", partOfSpeech: "phrase", gender: "none", example: "Et avec ceci ?", note: "" },
    { termTarget: "ça fait combien ?", termNative: "was macht das?", partOfSpeech: "phrase", gender: "none", example: "Ça fait combien ?", note: "" },
    { termTarget: "la monnaie", termNative: "das Wechselgeld", partOfSpeech: "noun", gender: "none", example: "Voici votre monnaie.", note: "Auch: das Kleingeld." },
    { termTarget: "c'est tout", termNative: "das ist alles", partOfSpeech: "phrase", gender: "none", example: "Non merci, c'est tout.", note: "" },
  ],
  dialogue: [
    { speaker: "partner", textTarget: "Bonjour madame ! Qu'est-ce que je vous sers ?", textNative: "Guten Tag! Was darf es sein?", cueNative: "", hints: [] },
    {
      speaker: "user",
      textTarget: "Bonjour ! Je voudrais une baguette et deux croissants, s'il vous plaît.",
      textNative: "Guten Tag! Ich hätte gern ein Baguette und zwei Croissants, bitte.",
      cueNative: "Grüße und bestelle ein Baguette und zwei Croissants.",
      hints: ["je voudrais · une baguette · deux croissants", "Bonjour ! Je voudrais …", "Bonjour ! Je voudrais une baguette et deux croissants, s'il vous plaît."],
    },
    { speaker: "partner", textTarget: "Très bien. Et avec ceci ?", textNative: "Sehr gut. Sonst noch etwas?", cueNative: "", hints: [] },
    {
      speaker: "user",
      textTarget: "Vous avez aussi du pain complet ?",
      textNative: "Haben Sie auch Vollkornbrot?",
      cueNative: "Frag, ob es auch Vollkornbrot gibt.",
      hints: ["avoir · du pain complet", "Vous avez aussi …", "Vous avez aussi du pain complet ?"],
    },
    { speaker: "partner", textTarget: "Oui, bien sûr. Il est encore chaud !", textNative: "Ja, natürlich. Es ist noch warm!", cueNative: "", hints: [] },
    {
      speaker: "user",
      textTarget: "Parfait, je le prends. Ça fait combien ?",
      textNative: "Perfekt, ich nehme es. Was macht das?",
      cueNative: "Sag, dass du es nimmst, und frag nach dem Preis.",
      hints: ["je le prends · ça fait combien", "Parfait, je le prends …", "Parfait, je le prends. Ça fait combien ?"],
    },
    { speaker: "partner", textTarget: "Ça fait sept euros vingt, s'il vous plaît.", textNative: "Das macht sieben Euro zwanzig, bitte.", cueNative: "", hints: [] },
    {
      speaker: "user",
      textTarget: "Voilà. Merci beaucoup, bonne journée !",
      textNative: "Bitte schön. Vielen Dank, einen schönen Tag!",
      cueNative: "Gib das Geld, bedanke dich und verabschiede dich.",
      hints: ["voilà · merci · bonne journée", "Voilà. Merci …", "Voilà. Merci beaucoup, bonne journée !"],
    },
  ],
};
