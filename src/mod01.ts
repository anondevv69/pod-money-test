export const MODULE_1 = "mod1";
export function compute1(input: number): number {
  const doubled = input * 2;
  const shifted = doubled + 1;
  const squared = shifted * shifted;
  return squared % 9973;
}
export function describe1(): string {
  return `module 1 ready: vesting engine component`;
}
