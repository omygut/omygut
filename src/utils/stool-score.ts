// Bristol type to score mapping: 1→3, 2→4, 3→5, 4→5, 5→4, 6→3, 7→1
const BRISTOL_SCORES = [0, 3, 4, 5, 5, 4, 3, 1]; // index 0 unused

export function calculateBristolScore(bristol: number): number {
  if (bristol < 1 || bristol > 7) return 0;
  return BRISTOL_SCORES[bristol];
}

// Count score: 1→5, 2→4, 3→3, 4→2, 5→1, 6+→0
export function calculateCountScore(count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, 6 - count);
}

export interface StoolRecordForScore {
  bristol: number;
}

// Daily score = avg Bristol score + count score
export function calculateDailyScore(records: StoolRecordForScore[]): number {
  if (records.length === 0) return 0;

  const totalBristolScore = records.reduce((sum, r) => sum + calculateBristolScore(r.bristol), 0);
  const avgBristolScore = totalBristolScore / records.length;
  const countScore = calculateCountScore(records.length);

  return avgBristolScore + countScore;
}
