/**
 * Applies the saved theme before first paint, so dark mode never flashes light.
 * Light is the default regardless of the device setting (DS-5); dark is opt-in.
 * Later this preference moves to the user profile (U-2); localStorage is the local fallback.
 */
export const THEME_STORAGE_KEY = "theme";

const script = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
