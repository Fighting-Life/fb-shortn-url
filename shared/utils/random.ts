import {
  uniqueNamesGenerator,
  type Config,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}
export function stringToBooleanStrict(str: string): boolean {
  return str.toLowerCase() === "true";
}
function replaceRandomChar(password: string, charSet: string): string {
  const randomIndex = Math.floor(Math.random() * password.length);
  const randomCharFromSet = charSet[Math.floor(Math.random() * charSet.length)];
  return (
    password.substring(0, randomIndex) +
    randomCharFromSet +
    password.substring(randomIndex + 1)
  );
}

export function calculatePercentage(current: number, previous: number) {
  if (previous === 0) {
    return {
      value: current > 0 ? "+100%" : "0%",
      status: current > 0 ? "New data" : "No change",
      trend: current > 0 ? "up" : "neutral",
    };
  }

  const percentage = ((current - previous) / previous) * 100;
  const absPercentage = Math.abs(percentage);
  const value = `${percentage >= 0 ? "+" : ""}${absPercentage.toFixed(1)}%`;

  let status: string;
  let trend: "up" | "down" | "neutral";

  if (percentage > 0) {
    status = `Increased ${absPercentage.toFixed(1)}% this period`;
    trend = "up";
  } else if (percentage < 0) {
    status = `Decreased ${absPercentage.toFixed(1)}% this period`;
    trend = "down";
  } else {
    status = "No change this period";
    trend = "neutral";
  }

  return { value, status, trend };
}
export function postgresArrayToStringArray(data: any): string[] {
  const cleanedString = data.slice(1, -1);
  const stringArray: string[] = cleanedString.split(", ");
  return stringArray;
}
export function compareVersions(a: string, b: string): number {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  return 0;
}
const config: Config = {
  dictionaries: [adjectives, colors, animals],
  separator: "-",
  length: 3,
  style: "capital",
};

export const randomBusinessName: string = uniqueNamesGenerator(config);
