/**
 * Returns the active seasonal/holiday effect key based on the current date.
 * First matching range wins. Use with SeasonalEffect in MainLayout.
 *
 * Effects: newyear_eve | christmas | newyear | cny | valentine | stpatricks | halloween | cherry | songkran | easter | null
 *
 * --- Seasonal plan (effect => date range) ---
 * newyear_eve  => 31 Dec only
 * christmas    => 18 to 25 Dec
 * newyear      => 1 Jan and 2 Jan
 * cny          => 21 Jan to 20 Feb (Chinese New Year window)
 * valentine    => 14 Feb only
 * stpatricks   => 17 Mar only
 * halloween    => 25 to 31 Oct
 * songkran     => 13 to 15 Apr
 * easter       => 1 to 12 Apr
 * cherry       => 15 Mar to 30 Apr (lower priority: stpatricks / easter / songkran win when they match)
 */
export function useSeasonalEffect(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();

  const same = (mo, day) => m === mo && d === day;
  const inRange = (mStart, dStart, mEnd, dEnd) => {
    if (m < mStart || m > mEnd) return false;
    if (m === mStart && d < dStart) return false;
    if (m === mEnd && d > dEnd) return false;
    return true;
  };

  // Order matters: most specific first
  if (same(12, 31)) return "newyear_eve";
  if (inRange(12, 18, 12, 25)) return "christmas";
  if (same(1, 1) || same(1, 2)) return "newyear";
  // Chinese New Year: approximate fixed range (e.g. Jan 21 - Feb 20)
  if (inRange(1, 15, 2, 28)) return "cny";
  if (inRange(2, 7, 2, 14)) return "valentine";
  if (inRange(3, 10, 3, 17)) return "stpatricks";
  if (inRange(10, 25, 10, 31)) return "halloween";
  if (inRange(4, 10, 4, 17)) return "songkran";
  if (inRange(4, 1, 4, 12)) return "easter";
  if (inRange(3, 15, 4, 30)) return "cherry"; // Mar 15 - Apr 30 (stpatricks/holi/songkran/easter take priority)

  return null;
}
