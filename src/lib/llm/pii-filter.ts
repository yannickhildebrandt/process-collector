export interface PIIFilterResult {
  filteredText: string;
  replacements: { original: string; placeholder: string; type: string }[];
  warnings: string[];
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const TAGGED_NAME_REGEX = /\[PII:NAME:(.*?)\]/g;

// Common patterns that might indicate untagged PII
const POTENTIAL_PII_PATTERNS = [
  /(?:Herr|Frau|Mr\.?|Mrs\.?|Ms\.?|Dr\.?)\s+[A-ZÄÖÜ][a-zäöüß]+/g,
  /(?:Tel|Phone|Fax)[\s.:]+[\d\s+()-]{7,}/gi,
];

export function stripPII(text: string): PIIFilterResult {
  const replacements: PIIFilterResult["replacements"] = [];
  const warnings: string[] = [];
  let filteredText = text;
  let emailCounter = 0;
  let nameCounter = 0;

  // Replace tagged names first
  filteredText = filteredText.replace(TAGGED_NAME_REGEX, (_match, name) => {
    nameCounter++;
    const placeholder = `[PERSON_${nameCounter}]`;
    replacements.push({ original: name, placeholder, type: "name" });
    return placeholder;
  });

  // Replace email addresses
  filteredText = filteredText.replace(EMAIL_REGEX, (match) => {
    emailCounter++;
    const placeholder = `[EMAIL_${emailCounter}]`;
    replacements.push({ original: match, placeholder, type: "email" });
    return placeholder;
  });

  // Warn about potential untagged PII
  for (const pattern of POTENTIAL_PII_PATTERNS) {
    const matches = filteredText.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Don't warn about already-replaced placeholders
        if (!match.startsWith("[")) {
          warnings.push(
            `Potential PII detected (not tagged): "${match}". Consider tagging with [PII:NAME:...] format.`
          );
        }
      }
    }
  }

  return { filteredText, replacements, warnings };
}
