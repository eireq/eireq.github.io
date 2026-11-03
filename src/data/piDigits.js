const DECIMAL_PLACES = 1000;

// arctan(1/inv) as a big integer scaled by 10^places
function arctanInv(inv, places) {
  const invN = BigInt(inv);
  const invSq = invN * invN;
  let term = 10n ** BigInt(places) / invN;
  let sum = 0n;
  let n = 1n;
  let sign = 1n;

  while (term !== 0n) {
    const delta = term / n;
    if (delta === 0n) break;
    sum += sign * delta;
    term /= invSq;
    n += 2n;
    sign = -sign;
  }

  return sum;
}

// machin's formula: pi = 16 arctan(1/5) - 4 arctan(1/239).
// computed here instead of pasting 1000 digits into the file.
// the 20 extra digits soak up rounding error at the end
function piDecimals(decimals) {
  const guard = 20;
  const places = decimals + guard;
  const raw = 16n * arctanInv(5, places) - 4n * arctanInv(239, places);
  const shift = 10n ** BigInt(guard);
  const rounded = (raw + 5n * (shift / 10n)) / shift;
  return rounded.toString().slice(1, 1 + decimals);
}

export const PI_DECIMALS = piDecimals(DECIMAL_PLACES);
