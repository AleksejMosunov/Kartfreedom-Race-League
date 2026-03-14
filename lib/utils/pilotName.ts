const NAME_PART_REGEX = /^[\p{L}'’ -]+$/u;
const MAX_NAME_PART_LENGTH = 60;

export function normalizeNamePart(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => {
          if (!part) return part;
          const [first, ...rest] = [...part];
          return (
            first.toLocaleUpperCase("uk-UA") +
            rest.join("").toLocaleLowerCase("uk-UA")
          );
        })
        .join("-"),
    )
    .join(" ");
}

export function isValidNamePart(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_NAME_PART_LENGTH) {
    return false;
  }
  return Boolean(trimmed) && NAME_PART_REGEX.test(trimmed);
}

export function formatPilotFullName(name: string, surname?: string): string {
  const firstName = normalizeNamePart(name);
  const lastName = surname ? normalizeNamePart(surname) : "";
  return [firstName, lastName].filter(Boolean).join(" ");
}
