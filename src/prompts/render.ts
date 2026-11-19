/**
 * Prompt templates are versioned (A-7): each version lives in its own folder (v1/, v2/ …),
 * and the version used is stored with every generated lesson (Lesson.promptVersion).
 * Templates use {{placeholders}}; they never hard-code a language name.
 */
export const PROMPT_VERSION = "v1";

export function render(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!(key in vars)) throw new Error(`Missing prompt variable "${key}".`);
    return String(vars[key]);
  });
}
