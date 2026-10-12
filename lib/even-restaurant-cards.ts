export function defaultEvenRestaurantCards(): boolean {
  return true
}

export function parseEvenRestaurantCards(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  return defaultEvenRestaurantCards()
}
