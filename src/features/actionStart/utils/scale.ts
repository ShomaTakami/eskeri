export const SCALE_VALUES = [1, 2, 3, 4, 5] as const;

export function isScaleValue(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= SCALE_VALUES[0] &&
    value <= SCALE_VALUES[SCALE_VALUES.length - 1]
  );
}
