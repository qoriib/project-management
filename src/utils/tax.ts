export function calculatePpn12(dpp: number): number {
  // PPn 12 % = Dpp * (11/12) * 12%
  return dpp * (11 / 12) * 0.12;
}
