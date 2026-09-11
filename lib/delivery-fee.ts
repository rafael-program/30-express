// lib/delivery-fee.ts
import { calculateDistance } from './helpers';

const MARKET30_COORDS = { lat: -8.8383, lng: 13.2344 };

export function calculateDeliveryFee(clientLat: number, clientLng: number) {
  const distance = calculateDistance(
    MARKET30_COORDS.lat,
    MARKET30_COORDS.lng,
    clientLat,
    clientLng
  );

  // Taxa: 400 Kz por km (ex: 20km = 8.000 Kz) + taxa base opcional
  const baseFee = 0;
  const perKmFee = 400;
  return Math.round(baseFee + (distance * perKmFee));
}