export const NSFW_COURSE_ERROR =
  "That learning path can't be generated because it appears to request adult or sexually explicit content.";

export const PROHIBITED_COURSE_ERROR =
  "That learning path can't be generated because it appears to request instruction for harmful or weaponized activity.";

interface ContentSafetyResult {
  isBlocked: boolean;
  reason?: string;
}

const EXPLICIT_ADULT_PATTERNS = [
  /\b(?:porn|porno|pornography|pornographic|xxx|hentai|onlyfans|camgirl|camboy|webcam\s+model)\b/i,
  /\b(?:erotica|erotic|sexualized|sexually\s+explicit|nsfw)\b/i,
  /\b(?:blow\s*job|hand\s*job|rim\s*job|deep\s*throat|cunnilingus|fellatio)\b/i,
  /\b(?:oral|anal|group)\s+sex\b/i,
  /\b(?:masturbat(?:e|ion|ing)|orgasm|ejaculat(?:e|ion|ing))\b/i,
  /\b(?:fetish|bdsm|kink|dominatrix|sadomasochism)\b/i,
  /\b(?:escort|stripper|stripping|lap\s*dance)\b/i,
];

const EXPLICIT_TECHNIQUE_PATTERNS = [
  /\b(?:seduc(?:e|tion)|pleas(?:e|ure)|arous(?:e|al)|hook\s*up)\b/i,
  /\b(?:sexual|intimate)\s+(?:technique|performance|skill|skills|training|tips|guide|course)\b/i,
  /\bhow\s+to\s+(?:have|perform|do|make)\s+sex\b/i,
];

const EDUCATIONAL_CONTEXT_PATTERNS = [
  /\b(?:sex\s+education|sexual\s+health|reproductive\s+health|human\s+reproduction)\b/i,
  /\b(?:puberty|contraception|consent|sti|std|pregnancy|fertility|anatomy|biology)\b/i,
];

const REFUSAL_PATTERNS = [
  /\b(?:can(?:not|'t)|unable\s+to|won(?:not|'t))\s+(?:assist|help|provide|create|generate|comply)\b/i,
  /\b(?:against|violates?)\s+(?:policy|guidelines?)\b/i,
  /\b(?:inappropriate|not\s+appropriate|not\s+able\s+to)\b/i,
];

const NSFW_REFUSAL_CONTEXT_PATTERNS = [
  /\b(?:nsfw|adult|sexual|sexually\s+explicit|explicit\s+sexual|porn|pornographic|erotic)\b/i,
];

const HARMFUL_WEAPON_PATTERNS = [
  /\b(?:nuclear|atomic)\s+(?:weapon|weapons|warhead|bomb|device)s?\b/i,
  /\b(?:weapon|weapons|warhead|bomb|device)\s+(?:design|construction|fabrication|engineering|manufactur(?:e|ing))\b/i,
  /\b(?:build|make|construct|design|fabricate|assemble|develop)\s+(?:a\s+|an\s+)?(?:nuclear|atomic|radiological|dirty)\s+(?:weapon|warhead|bomb|device)\b/i,
  /\b(?:dirty\s+bomb|radiological\s+dispersal\s+device)\b/i,
  /\b(?:chemical|biological)\s+(?:weapon|weapons|warfare|agent|agents)\b/i,
  /\b(?:improvised\s+explosive|ied|pipe\s+bomb|suicide\s+bomb)\b/i,
];

const HARMFUL_WEAPON_CONTEXT_PATTERNS = [
  /\b(?:design|construct(?:ion)?|fabricat(?:e|ion|ing)|manufactur(?:e|ing)|assembl(?:e|y)|weaponiz(?:e|ation)|enrich(?:ment)?|detonat(?:e|ion)|yield|trigger|implosion|criticality)\b/i,
];

const HARMFUL_REFUSAL_CONTEXT_PATTERNS = [
  /\b(?:weapon|weapons|warhead|bomb|explosive|nuclear|atomic|radiological|chemical|biological|wmd|mass\s+destruction)\b/i,
];

function normalizeForSafety(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[_*`~|[\]{}()<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPattern(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function detectNsfwCourseContent(textParts: string[]): ContentSafetyResult {
  const text = normalizeForSafety(textParts.join(" "));
  if (!text) return { isBlocked: false };

  if (hasPattern(text, EXPLICIT_ADULT_PATTERNS)) {
    return { isBlocked: true, reason: "explicit adult content" };
  }

  if (hasPattern(text, EXPLICIT_TECHNIQUE_PATTERNS) && !hasPattern(text, EDUCATIONAL_CONTEXT_PATTERNS)) {
    return { isBlocked: true, reason: "sexual technique request" };
  }

  return { isBlocked: false };
}

export function detectProhibitedCourseContent(textParts: string[]): ContentSafetyResult {
  const text = normalizeForSafety(textParts.join(" "));
  if (!text) return { isBlocked: false };

  if (hasPattern(text, HARMFUL_WEAPON_PATTERNS)) {
    return { isBlocked: true, reason: "harmful weapons request" };
  }

  if (
    /\b(?:weapon|weapons|warhead|bomb|explosive|wmd|mass\s+destruction)\b/i.test(text) &&
    hasPattern(text, HARMFUL_WEAPON_CONTEXT_PATTERNS)
  ) {
    return { isBlocked: true, reason: "weaponized construction request" };
  }

  return { isBlocked: false };
}

export function detectNsfwGenerationRefusal(text: string): ContentSafetyResult {
  const normalized = normalizeForSafety(text);
  if (!normalized) return { isBlocked: false };

  if (hasPattern(normalized, REFUSAL_PATTERNS) && hasPattern(normalized, NSFW_REFUSAL_CONTEXT_PATTERNS)) {
    return { isBlocked: true, reason: "model refused nsfw content" };
  }

  return { isBlocked: false };
}

export function detectProhibitedGenerationRefusal(text: string): ContentSafetyResult {
  const normalized = normalizeForSafety(text);
  if (!normalized) return { isBlocked: false };

  if (hasPattern(normalized, REFUSAL_PATTERNS) && hasPattern(normalized, HARMFUL_REFUSAL_CONTEXT_PATTERNS)) {
    return { isBlocked: true, reason: "model refused harmful content" };
  }

  return { isBlocked: false };
}

export function collectStringValues(value: unknown, maxValues = 80): string[] {
  const values: string[] = [];
  const stack: unknown[] = [value];

  while (stack.length > 0 && values.length < maxValues) {
    const current = stack.pop();

    if (typeof current === "string") {
      values.push(current);
      continue;
    }

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    if (typeof current === "object" && current !== null) {
      stack.push(...Object.values(current));
    }
  }

  return values;
}
