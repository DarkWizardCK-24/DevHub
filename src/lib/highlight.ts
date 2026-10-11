/**
 * Syntax highlighting with highlight.js core + only the languages DevHub
 * supports, so the bundle doesn't ship 190 grammars nobody uses.
 */
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import dart from "highlight.js/lib/languages/dart";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import yaml from "highlight.js/lib/languages/yaml";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("dart", dart);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("python", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("yaml", yaml);

const ALIASES: Record<string, string> = { ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", sh: "bash", shell: "bash", py: "python", yml: "yaml" };

/** Returns HTML-escaped, highlighted markup (safe for dangerouslySetInnerHTML). */
export function highlight(code: string, language?: string): string {
  const lang = language ? (ALIASES[language] ?? language) : undefined;
  if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  return hljs.highlightAuto(code).value;
}
