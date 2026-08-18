// components/print/OrderPrint.tsx
'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface OrderItem {
  quantity: number;
  total_price: number;
  unit_price: number;
  products?: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  delivery_address: string;
  total_amount: number;
  delivery_fee: number;
  created_at: string;
  users?: {
    name: string;
    phone: string;
  };
  order_items?: OrderItem[];
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="p-4">
      <div className="mb-4">
        <p><strong>Pedido Nº:</strong> {order.id}</p>
        <p><strong>Cliente:</strong> {order.users?.name || 'N/A'}</p>
        <p><strong>Telefone:</strong> {order.users?.phone || 'N/A'}</p>
        <p><strong>Morada:</strong> {order.delivery_address}</p>
        <p><strong>Data:</strong> {new Date(order.created_at).toLocaleString()}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold">Itens do Pedido:</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Produto</th>
              <th className="text-left p-2">Qtd</th>
              <th className="text-left p-2">Preço</th>
              <th className="text-left p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items?.map((item: OrderItem, index: number) => (
              <tr key={index} className="border-b">
                <td className="p-2">{item.products?.name || 'N/A'}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2">{item.unit_price} Kz</td>
                <td className="p-2">{item.total_price} Kz</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td colSpan={3} className="p-2 text-right">Total:</td>
              <td className="p-2">{order.total_amount} Kz</td>
            </tr>
            <tr>
              <td colSpan={3} className="p-2 text-right">Taxa Entrega:</td>
              <td className="p-2">{order.delivery_fee} Kz</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export function OrderPrint({ order }: { order: Order }) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    documentTitle: `Pedido-${order.id}`,
    onBeforeGetContent: () => {
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('Impressão concluída');
    },
    content: () => componentRef.current,
  });

  return (
    <>
      <button
        onClick={() => handlePrint()}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
      >
        🖨️ Imprimir
      </button>

      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
          <div className="p-8 bg-white max-w-4xl mx-auto">
            {/* 1ª Via - Equipe de Compras */}
            <div className="border-2 border-gray-300 p-6 mb-8">
              <h2 className="text-2xl font-bold text-center mb-4">30 EXPRESS - VIA EQUIPE</h2>
              <OrderDetails order={order} />
              <div className="mt-8 pt-4 border-t">
                <p>Assinatura Equipe: __________________</p>
                <p className="text-sm text-gray-500 mt-2">Data: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="page-break" style={{ pageBreakAfter: 'always' }}></div>

            {/* 2ª Via - Cliente */}
            <div className="border-2 border-gray-300 p-6 mb-8">
              <h2 className="text-2xl font-bold text-center mb-4">30 EXPRESS - VIA CLIENTE</h2>
              <OrderDetails order={order} />
              <div className="mt-8 pt-4 border-t">
                <p>Assinatura Cliente: __________________</p>
                <p>Assinatura Entregador: __________________</p>
                <p className="text-sm text-gray-500 mt-2">Data: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="page-break" style={{ pageBreakAfter: 'always' }}></div>

            {/* 3ª Via - Administração */}
            <div className="border-2 border-gray-300 p-6 mb-8">
              <h2 className="text-2xl font-bold text-center mb-4">30 EXPRESS - VIA ADMINISTRAÇÃO</h2>
              <OrderDetails order={order} />
              <div className="mt-8 pt-4 border-t">
                <p>Assinatura Cliente: __________________</p>
                <p>Assinatura Entregador: __________________</p>
                <p className="text-sm text-gray-500 mt-2">Data: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}