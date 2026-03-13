export function getIgnoredSecretInputProps(name: string) {
  const normalizedName = String(name || "").trim() || "secret";

  return {
    name: normalizedName,
    autoComplete: "off",
    spellCheck: false,
    "data-bwignore": "true",
    "data-1p-ignore": "true",
  } as const;
}
