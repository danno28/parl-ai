import { describe, expect, it } from "vitest";
import { buildSsml, voiceFor } from "./azure";

describe("buildSsml", () => {
  it("sets language, voice and a slower rate, and escapes XML", () => {
    const ssml = buildSsml("Pain & beurre <s'il vous plaît>", "fr-FR", "fr-FR-DeniseNeural", 0.7);
    expect(ssml).toContain('xml:lang="fr-FR"');
    expect(ssml).toContain('<voice name="fr-FR-DeniseNeural">');
    expect(ssml).toContain('<prosody rate="-30%">');
    expect(ssml).toContain("Pain &amp; beurre &lt;s&apos;il vous plaît&gt;");
  });

  it("uses +0% at normal speed", () => {
    expect(buildSsml("Bonjour", "fr-FR", "v")).toContain('rate="+0%"');
  });
});

describe("voiceFor", () => {
  it("defaults to a French neural voice", () => {
    expect(voiceFor("fr-FR")).toBe("fr-FR-DeniseNeural");
  });
});
