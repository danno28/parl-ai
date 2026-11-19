import { describe, expect, it } from "vitest";
import { parseAssessment } from "./azure";
import { NoSpeechError } from "./types";

describe("parseAssessment", () => {
  it("reads scores that are flat on NBest (REST docs shape)", () => {
    const result = parseAssessment({
      RecognitionStatus: "Success",
      DisplayText: "Bonjour.",
      NBest: [
        {
          Display: "Bonjour.",
          AccuracyScore: 91.2,
          FluencyScore: 80,
          CompletenessScore: 100,
          PronScore: 88.6,
          Words: [{ Word: "bonjour", AccuracyScore: 91.2, ErrorType: "None" }],
        },
      ],
    });
    expect(result).toEqual({
      transcript: "Bonjour.",
      overall: 89,
      accuracy: 91,
      fluency: 80,
      completeness: 100,
      words: [{ word: "bonjour", accuracy: 91, error: "none" }],
    });
  });

  it("reads scores nested under PronunciationAssessment (SDK JSON shape)", () => {
    const result = parseAssessment({
      RecognitionStatus: 0,
      NBest: [
        {
          Display: "Deux croissants.",
          PronunciationAssessment: {
            AccuracyScore: 70,
            FluencyScore: 60,
            CompletenessScore: 50,
            PronScore: 62,
          },
          Words: [
            { Word: "deux", PronunciationAssessment: { AccuracyScore: 95, ErrorType: "None" } },
            {
              Word: "croissants",
              PronunciationAssessment: { AccuracyScore: 40, ErrorType: "Mispronunciation" },
            },
            { Word: "s'il", PronunciationAssessment: { AccuracyScore: 0, ErrorType: "Omission" } },
          ],
        },
      ],
    });
    expect(result.overall).toBe(62);
    expect(result.words.map((w) => w.error)).toEqual(["none", "mispronunciation", "omission"]);
  });

  it("throws NoSpeechError when nothing was recognized", () => {
    expect(() => parseAssessment({ RecognitionStatus: "InitialSilenceTimeout" })).toThrow(
      NoSpeechError,
    );
  });
});
