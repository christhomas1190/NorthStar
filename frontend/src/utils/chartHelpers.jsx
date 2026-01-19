export function niceTicks(max, count = 4) {
  if (max <= 0) return [0];
  const nice = (x) => {
    const exp = Math.floor(Math.log10(x));
    const f = x / Math.pow(10, exp);
    let nf;
    if (f < 1.5) nf = 1;
    else if (f < 3) nf = 2;
    else if (f < 7) nf = 5;
    else nf = 10;
    return nf * Math.pow(10, exp);
  };
  const step = nice(max / count);
  const ticks = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Math.round(v));
  if (ticks[ticks.length - 1] !== max) ticks.push(Math.round(max));
  return Array.from(new Set(ticks)).sort((a, b) => a - b);
}