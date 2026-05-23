import type { FeelingAfter } from '../types/actionLog';

export function feelingAfterLabel(feeling: FeelingAfter): string {
  switch (feeling) {
    case 'light':
      return '軽かった';
    case 'normal':
      return '普通';
    case 'heavy':
      return '重かった';
  }
}

export function heavinessLabel(value: number): string {
  return `${value}`;
}
