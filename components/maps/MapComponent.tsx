'use client';

type MapComponentProps = {
  center?: [number, number];
  zoom?: number;
  markers?: unknown[];
  height?: string;
  className?: string;
};

export default function MapComponent({
  height = '400px',
  className = '',
}: MapComponentProps) {
  return (
    <div
      className={`rounded-2xl bg-[#f0f4f0] flex items-center justify-center ${className}`}
      style={{ height }}
    >
      <p className="text-gray-500">🗺️ Mapa em desenvolvimento</p>
    </div>
  );
}