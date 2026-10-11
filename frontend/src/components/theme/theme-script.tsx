/**
 * Runs before first paint so the page never flashes the wrong theme.
 * Preference order: saved choice in localStorage → system setting → dark.
 */
export const THEME_STORAGE_KEY = "devhub-theme";

const script = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
