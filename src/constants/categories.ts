export const DEFAULT_CATEGORIES = [
  '일반',
  '프론트엔드',
  '백엔드',
  'CS/자료구조',
  '알고리즘',
  '행동면접',
] as const

export const CATEGORY_COLOR_MAP: Record<string, string> = {
  '일반': 'bg-gray-100 text-gray-700',
  '프론트엔드': 'bg-blue-100 text-blue-700',
  '백엔드': 'bg-purple-100 text-purple-700',
  'CS/자료구조': 'bg-amber-100 text-amber-700',
  '알고리즘': 'bg-green-100 text-green-700',
  '행동면접': 'bg-pink-100 text-pink-700',
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLOR_MAP[category] ?? 'bg-gray-100 text-gray-600'
}
