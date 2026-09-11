// components/print/OrderPrint.tsx
'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, X } from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  items?: OrderItem[];
};

type OrderPrintProps = {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
};

// ============================================================
// FORMATADORES
// ============================================================
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatOrderNumber = (id: string) => {
  return `#${id.slice(0, 8).toUpperCase()}`;
};

// ============================================================
// COMPONENTE DE IMPRESSÃO (conteúdo a ser impresso)
// ============================================================
function PrintContent({ order }: { order: Order }) {
  return (
    <div className="p-4 bg-white text-black text-xs">
      {/* ============================================
          VIA 1: EQUIPE DE COMPRAS
          ============================================ */}
      <div className="mb-6 pb-6 border-b-2 border-dashed border-black">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-lg font-bold">MERCADO DO 30</h1>
            <p className="text-xs">30 Express — Via 1: EQUIPE DE COMPRAS</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-base">
              {formatOrderNumber(order.id)}
            </p>
            <p className="text-xs">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="font-bold">CLIENTE:</p>
          <p>{order.customer_name}</p>
          <p>Tel: {order.customer_phone}</p>
        </div>

        <div className="mb-3">
          <p className="font-bold">ENDEREÇO DE ENTREGA:</p>
          <p>{order.delivery_address}</p>
          {order.delivery_lat && order.delivery_lng && (
            <p className="text-xs">
              GPS: {order.delivery_lat.toFixed(5)}, {order.delivery_lng.toFixed(5)}
            </p>
          )}
        </div>

        <table className="w-full border-collapse border border-black text-xs mb-3">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black px-1 py-1 text-left">Item</th>
              <th className="border border-black px-1 py-1 text-center w-12">Qtd</th>
              <th className="border border-black px-1 py-1 text-right w-20">Preço</th>
              <th className="border border-black px-1 py-1 text-right w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td className="border border-black px-1 py-1">
                  {item.product_name}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {item.quantity}
                </td>
                <td className="border border-black px-1 py-1 text-right">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="border border-black px-1 py-1 text-right">
                  {formatCurrency(item.total_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56">
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Taxa de Entrega:</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-black mt-1 pt-1">
              <span>TOTAL:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Pagamento:</span>
              <span className="capitalize">
                {order.payment_method || 'Não informado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          VIA 2: CLIENTE (com assinatura)
          ============================================ */}
      <div className="mb-6 pb-6 border-b-2 border-dashed border-black">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-lg font-bold">MERCADO DO 30</h1>
            <p className="text-xs">30 Express — Via 2: CLIENTE</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-base">
              {formatOrderNumber(order.id)}
            </p>
            <p className="text-xs">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="mb-2">
          <p className="font-bold">CLIENTE:</p>
          <p>{order.customer_name}</p>
          <p>Tel: {order.customer_phone}</p>
        </div>

        <div className="mb-2">
          <p className="font-bold">ENDEREÇO:</p>
          <p>{order.delivery_address}</p>
        </div>

        <table className="w-full border-collapse border border-black text-xs mb-3">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black px-1 py-1 text-left">Item</th>
              <th className="border border-black px-1 py-1 text-center w-12">Qtd</th>
              <th className="border border-black px-1 py-1 text-right w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td className="border border-black px-1 py-1">
                  {item.product_name}
                </td>
                <td className="border border-black px-1 py-1 text-center">
                  {item.quantity}
                </td>
                <td className="border border-black px-1 py-1 text-right">
                  {formatCurrency(item.total_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-56">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL A PAGAR:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Pagamento:</span>
              <span className="capitalize">
                {order.payment_method || 'Não informado'}
              </span>
            </div>
          </div>
        </div>

        {/* Assinatura do Cliente */}
        <div className="mt-8 pt-4">
          <div className="border-t border-black w-64 mb-1"></div>
          <p className="text-xs">Assinatura do Cliente</p>
          <p className="text-xs text-gray-500 mt-1">
            Data: ____ / ____ / ________
          </p>
        </div>
      </div>

      {/* ============================================
          VIA 3: ADMINISTRATIVO (com assinatura entregador)
          ============================================ */}
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-lg font-bold">MERCADO DO 30</h1>
            <p className="text-xs">30 Express — Via 3: ADMINISTRATIVO</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-base">
              {formatOrderNumber(order.id)}
            </p>
            <p className="text-xs">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="mb-2">
          <p className="font-bold">CLIENTE:</p>
          <p>{order.customer_name}</p>
          <p>Tel: {order.customer_phone}</p>
        </div>

        <div className="mb-2">
          <p className="font-bold">ENDEREÇO:</p>
          <p>{order.delivery_address}</p>
        </div>

        <div className="flex justify-between text-sm mb-6">
          <div>
            <p className="text-xs">Status do Pedido:</p>
            <p className="font-bold capitalize">{order.status}</p>
          </div>
          <div className="text-right">
            <p className="text-xs">Total:</p>
            <p className="font-bold text-base">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
        </div>

        {/* Assinatura do Entregador */}
        <div className="mt-8 pt-4">
          <div className="border-t border-black w-64 mb-1"></div>
          <p className="text-xs">Assinatura do Entregador</p>
          <p className="text-xs text-gray-500 mt-1">
            Data: ____ / ____ / ________
          </p>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-6 pt-3 border-t border-black text-center text-xs text-gray-600">
        <p>30 Express — Mercado do 30 | Obrigado pela preferência!</p>
        <p>www.30express.ao</p>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function OrderPrint({
  order,
  isOpen,
  onClose,
}: OrderPrintProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  // ✅ API v3: usa contentRef + onBeforePrint (sem onBeforeGetContent)
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Pedido-${formatOrderNumber(order.id)}`,
    onBeforePrint: () => {
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('✅ Impressão concluída');
    },
    onPrintError: (errorLocation, error) => {
      console.error('❌ Erro na impressão:', errorLocation, error);
      alert('Erro ao imprimir. Verifique se a impressora está conectada.');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Printer className="w-6 h-6 text-[#2d6a4f]" />
            <div>
              <h2 className="text-xl font-bold text-[#2d6a4f]">
                Imprimir Pedido
              </h2>
              <p className="text-xs text-gray-500">
                3 vias: Compras, Cliente e Administrativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview (área rolável) */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div
            ref={componentRef}
            className="bg-white shadow-lg mx-auto"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <PrintContent order={order} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-white">
          <button
            onClick={() => handlePrint()}
            className="flex-1 py-3 bg-[#2d6a4f] text-white rounded-xl hover:bg-[#1b4332] transition font-medium flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir 3 Vias
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-medium"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}