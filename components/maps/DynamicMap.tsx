// components/maps/DynamicMap.tsx
'use client';

import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(
  () => import('./MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-2xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2d6a4f] mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando mapa...</p>
        </div>
      </div>
    ),
  }
);

export default MapWithNoSSR;