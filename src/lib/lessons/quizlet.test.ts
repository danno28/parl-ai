import { describe, expect, it } from "vitest";
import { parseVocabularyList, toQuizletTsv } from "./quizlet";
import type { VocabularyItem } from "@/lib/schemas/lesson";

const item = (termTarget: string, termNative: string, gender: VocabularyItem["gender"] = "none"): VocabularyItem => ({
  termTarget,
  termNative,
  partOfSpeech: "noun",
  gender,
  example: "",
  note: "",
  inDialogue: true,
});

describe("toQuizletTsv", () => {
  it("writes target<TAB>native per line with no header, and adds hidden gender", () => {
    expect(
      toQuizletTsv([item("la baguette", "das Baguette"), item("l'addition", "die Rechnung", "f")]),
    ).toBe("la baguette\tdas Baguette\nl'addition (f)\tdie Rechnung");
  });

  it("removes tabs and line breaks inside terms", () => {
    expect(toQuizletTsv([item("le\tpain", "das\nBrot")])).toBe("le pain\tdas Brot");
  });
});

describe("parseVocabularyList", () => {
  it("detects tab, semicolon or comma separators", () => {
    expect(parseVocabularyList("le pain\tdas Brot")).toEqual([{ target: "le pain", native: "das Brot" }]);
    expect(parseVocabularyList("le pain;das Brot")).toEqual([{ target: "le pain", native: "das Brot" }]);
    expect(parseVocabularyList("le pain, das Brot")).toEqual([{ target: "le pain", native: "das Brot" }]);
  });

  it("can swap columns and skips incomplete lines", () => {
    expect(parseVocabularyList("das Brot\tle pain\nnur eins", { swapColumns: true })).toEqual([
      { target: "le pain", native: "das Brot" },
    ]);
  });
});
