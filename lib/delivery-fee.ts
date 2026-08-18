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

  // Taxa: 100 Kz por km + taxa base
  const baseFee = 500;
  const perKmFee = 100;
  return Math.round(baseFee + (distance * perKmFee));
}