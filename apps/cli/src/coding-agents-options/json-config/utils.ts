/**
 * Gets a nested value from an object using dot-notation path
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Sets a nested value in an object using dot-notation path
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]!] = value;
}

