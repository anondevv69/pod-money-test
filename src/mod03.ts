export const MODULE_3 = "mod3";
export function compute3(input: number): number {
  const doubled = input * 2;
  const shifted = doubled + 3;
  const squared = shifted * shifted;
  return squared % 9973;
}
export function describe3(): string {
  return `module 3 ready: vesting engine component`;
}
