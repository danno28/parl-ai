import { describe, expect, it, vi } from "vitest";

// feedback.ts imports the AI layer; these tests only cover the pure scoring helpers.
vi.mock("@/lib/ai", () => ({ generateValidated: vi.fn() }));

const { feedbackFromScores, feedbackFromTypedText } = await import("./feedback");

describe("feedbackFromTypedText", () => {
  const line = "Bonjour ! Je voudrais une baguette et deux croissants, s'il vous plaît.";

  it("gives full marks for an exact copy, ignoring accents and punctuation", () => {
    const f = feedbackFromTypedText(line, "bonjour je voudrais une baguette et deux croissants s'il vous plait");
    expect(f.score).toBe(100);
    expect(f.problemWords).toEqual([]);
  });

  it("names misspelled words and lowers the score", () => {
    const f = feedbackFromTypedText(line, "Bonjour ! Je voudrais une baguette et deux crosants, s'il vous plaît.");
    expect(f.problemWords).toEqual(["croissants"]);
    expect(f.score).toBeLessThan(100);
    expect(f.score).toBeGreaterThan(80);
  });
});

describe("feedbackFromScores", () => {
  it("labels by overall score and lists weak words", () => {
    const f = feedbackFromScores({
      transcript: "",
      overall: 70,
      accuracy: 70,
      fluency: 70,
      completeness: 100,
      words: [
        { word: "deux", accuracy: 95, error: "none" },
        { word: "croissants", accuracy: 40, error: "mispronunciation" },
      ],
    });
    expect(f.label).toBe("good");
    expect(f.problemWords).toEqual(["croissants"]);
  });
});
