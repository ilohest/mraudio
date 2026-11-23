const TABLE: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

export function toRoman(n: number): string {
  let r = ''
  for (const [v, s] of TABLE) while (n >= v) { r += s; n -= v }
  return r
}

export function fromRoman(input: string): number | null {
  const s = input.trim().toUpperCase()
  if (!/^[IVXLCDM]+$/.test(s)) return null
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let n = 0, last = 0
  for (let i = s.length - 1; i >= 0; i--) {
    const x = v[s[i]]
    if (x < last) n -= x
    else { n += x; last = x }
  }
  return toRoman(n) === s ? n : null
}

/** "7", "07", "VII", "vii" → 7 */
export function parseBook(input: string): number | null {
  const s = input.trim()
  if (!s) return null
  if (/^\d{1,2}$/.test(s)) return parseInt(s, 10)
  return fromRoman(s)
}
