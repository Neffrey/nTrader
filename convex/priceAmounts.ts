export function simplifyAmounts(amountA: number, amountB: number) {
  if (amountA === 1 || amountB === 1) {
    return { amountA, amountB };
  }
  return { amountA: 1, amountB: amountB / amountA };
}
