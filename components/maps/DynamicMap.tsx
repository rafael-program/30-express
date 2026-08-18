'use client';

import dynamic from 'next/dynamic';

// Importar o CSS no cliente
if (typeof window !== 'undefined') {
  import('leaflet/dist/leaflet.css');
}

const MapWithNoSSR = dynamic(
  () => import('./MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Carregando mapa...
      </div>
    ),
  }
);

export default function DynamicMap;