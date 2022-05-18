// Generates a random integer between 1 and 20_000_000 to simulate an ip address
export function generateIpAddress(): string {
  return `${Math.round(Math.random() * 20_000_000 + 1)}`;
}
