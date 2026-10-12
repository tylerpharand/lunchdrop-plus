export interface RestaurantTileDetails {
  enhanced: boolean
}

export function defaultRestaurantTileDetails(): RestaurantTileDetails {
  return { enhanced: true }
}

export function parseRestaurantTileDetails(value: unknown): RestaurantTileDetails {
  if (!isRecord(value)) return defaultRestaurantTileDetails()
  const enhanced = value['enhanced']
  if (typeof enhanced === 'boolean') return { enhanced }
  const hideOrderBy = value['hideOrderBy']
  const hideDeliveryTimes = value['hideDeliveryTimes']
  if (typeof hideOrderBy === 'boolean' || typeof hideDeliveryTimes === 'boolean') {
    return { enhanced: hideOrderBy === true || hideDeliveryTimes === true }
  }
  return defaultRestaurantTileDetails()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
