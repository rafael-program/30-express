// components/PrintOrder.tsx
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

type PrintOrderProps = {
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

// URL do QR Code
const getQrCodeUrl = (orderId: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${formatOrderNumber(orderId)}`;
};

// ============================================================
// VIA 1 — EQUIPE DE COMPRAS (Com QR Code)
// ============================================================
function ViaCompras({ order }: { order: Order }) {
  return (
    <div className="p-4 text-[11px] text-black font-sans bg-white">
      {/* Cabeçalho */}
      <div className="text-center mb-3">
        <h1 className="text-base font-bold uppercase tracking-widest border-b border-black pb-1 inline-block">30 Express</h1>
        <p className="text-[10px] font-semibold mt-1 text-gray-700">MERCADO DO 30</p>
        <p className="text-[9px] uppercase tracking-wider text-gray-500">Via: Equipe de Compras</p>
      </div>

      {/* Identificação do Pedido */}
      <div className="border-y border-dashed border-black py-1.5 mb-3 text-center bg-gray-50">
        <p className="font-bold text-sm">{formatOrderNumber(order.id)}</p>
        <p className="text-[9px] text-gray-600">{formatDate(order.created_at)}</p>
      </div>

      {/* Dados do Cliente */}
      <div className="mb-3">
        <p className="font-bold text-[9px] uppercase tracking-wider mb-0.5">Cliente:</p>
        <p className="font-semibold text-[11px] leading-tight">{order.customer_name}</p>
        <p className="text-[10px] text-gray-700">Tel: {order.customer_phone}</p>
      </div>

      {/* Endereço */}
      <div className="mb-3">
        <p className="font-bold text-[9px] uppercase tracking-wider mb-0.5">Endereço de Entrega:</p>
        <p className="leading-tight text-[10px]">{order.delivery_address}</p>
        {order.delivery_lat && order.delivery_lng && (
          <p className="text-[8px] text-gray-500 mt-0.5">
            GPS: {order.delivery_lat.toFixed(5)}, {order.delivery_lng.toFixed(5)}
          </p>
        )}
      </div>

      {/* Itens */}
      <table className="w-full border-collapse text-[10px] mb-3">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1 font-bold">Item</th>
            <th className="text-center w-8 font-bold">Qtd</th>
            <th className="text-right w-16 font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item) => (
            <tr key={item.id} className="border-b border-gray-200 border-dashed">
              <td className="py-1 pr-1 leading-tight">{item.product_name}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{formatCurrency(item.total_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totais */}
      <div className="border-t border-black pt-1.5 space-y-0.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-600">Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-600">Taxa Entrega:</span>
          <span>{formatCurrency(order.delivery_fee)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-black border-dotted">
          <span>TOTAL:</span>
          <span>{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="flex justify-between text-[9px] mt-1 text-gray-700">
          <span>Pagamento:</span>
          <span className="uppercase">{order.payment_method}</span>
        </div>
      </div>

      {/* Assinatura e QR */}
      <div className="mt-6 pt-2 border-t border-black border-dashed flex justify-between items-end">
        <div className="w-3/5">
          <p className="text-[9px] uppercase tracking-wider font-bold mb-4">Preparado por:</p>
          <div className="border-t border-black w-full mb-1"></div>
          <p className="text-[8px] text-gray-500">Assinatura</p>
        </div>
        <div className="text-center">
           {/* ✅ Usando img normal para evitar bloqueio do Next.js */}
           <img 
             src={getQrCodeUrl(order.id)} 
             alt="QR Code" 
             width={60} 
             height={60} 
             className="border border-gray-200 p-0.5"
           />
           <p className="text-[7px] text-gray-500 mt-0.5 font-mono">Rastreio</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VIA 2 — CLIENTE (Com Espaço Generoso para Assinatura)
// ============================================================
function ViaCliente({ order }: { order: Order }) {
  return (
    <div className="p-4 text-[11px] text-black font-sans bg-white">
      {/* Cabeçalho */}
      <div className="text-center mb-3">
        <h1 className="text-base font-bold uppercase tracking-widest border-b border-black pb-1 inline-block">30 Express</h1>
        <p className="text-[10px] font-semibold mt-1 text-gray-700">MERCADO DO 30</p>
        <p className="text-[9px] uppercase tracking-wider text-gray-500">Via: Cliente</p>
      </div>

      {/* Identificação do Pedido */}
      <div className="border-y border-dashed border-black py-1.5 mb-3 text-center bg-gray-50">
        <p className="font-bold text-sm">{formatOrderNumber(order.id)}</p>
        <p className="text-[9px] text-gray-600">{formatDate(order.created_at)}</p>
      </div>

      {/* Dados do Cliente */}
      <div className="mb-3">
        <p className="font-bold text-[9px] uppercase tracking-wider mb-0.5">Cliente:</p>
        <p className="font-semibold text-[11px] leading-tight">{order.customer_name}</p>
        <p className="text-[10px] text-gray-700">Tel: {order.customer_phone}</p>
      </div>

      {/* Endereço */}
      <div className="mb-3">
        <p className="font-bold text-[9px] uppercase tracking-wider mb-0.5">Endereço:</p>
        <p className="leading-tight text-[10px]">{order.delivery_address}</p>
      </div>

      {/* Itens */}
      <table className="w-full border-collapse text-[10px] mb-3">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1 font-bold">Item</th>
            <th className="text-center w-8 font-bold">Qtd</th>
            <th className="text-right w-16 font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item) => (
            <tr key={item.id} className="border-b border-gray-200 border-dashed">
              <td className="py-1 pr-1 leading-tight">{item.product_name}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{formatCurrency(item.total_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totais */}
      <div className="border-t border-black pt-1.5">
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL A PAGAR:</span>
          <span>{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="flex justify-between text-[9px] mt-1 text-gray-700">
          <span>Pagamento:</span>
          <span className="uppercase">{order.payment_method}</span>
        </div>
      </div>

      {/* Assinatura do Cliente - Área Generosa */}
      <div className="mt-12 pt-4 border-t border-black border-dashed">
        <p className="text-[9px] uppercase tracking-wider font-bold text-center mb-8">Assinatura do Cliente</p>
        <div className="border-t border-black w-4/5 mx-auto mb-1"></div>
        <p className="text-[8px] text-gray-500 text-center">Assinatura</p>
        <p className="text-[8px] text-gray-500 text-center mt-2">Data: ____ / ____ / ________</p>
      </div>
    </div>
  );
}

// ============================================================
// VIA 3 — ADMINISTRATIVO (Com Espaço para Assinatura do Entregador)
// ============================================================
function ViaAdministrativo({ order }: { order: Order }) {
  return (
    <div className="p-4 text-[11px] text-black font-sans bg-white">
      {/* Cabeçalho */}
      <div className="text-center mb-3">
        <h1 className="text-base font-bold uppercase tracking-widest border-b border-black pb-1 inline-block">30 Express</h1>
        <p className="text-[10px] font-semibold mt-1 text-gray-700">MERCADO DO 30</p>
        <p className="text-[9px] uppercase tracking-wider text-gray-500">Via: Administrativo</p>
      </div>

      {/* Identificação do Pedido */}
      <div className="border-y border-dashed border-black py-1.5 mb-3 text-center bg-gray-50">
        <p className="font-bold text-sm">{formatOrderNumber(order.id)}</p>
        <p className="text-[9px] text-gray-600">{formatDate(order.created_at)}</p>
      </div>

      {/* Dados do Cliente */}
      <div className="mb-3">
        <p className="font-bold text-[9px] uppercase tracking-wider mb-0.5">Cliente:</p>
        <p className="font-semibold text-[11px] leading-tight">{order.customer_name}</p>
        <p className="text-[10px] text-gray-700">Tel: {order.customer_phone}</p>
      </div>

      {/* Endereço */}
      <div className="mb-3">
        <p className="font-bold text-[9px] uppercase tracking-wider mb-0.5">Endereço:</p>
        <p className="leading-tight text-[10px]">{order.delivery_address}</p>
      </div>

      {/* Status e Total */}
      <div className="flex justify-between text-[11px] mb-4 border-y border-black border-dotted py-1.5 bg-gray-50">
        <div>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Status do Pedido:</p>
          <p className="font-bold capitalize text-[11px]">{order.status}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Total:</p>
          <p className="font-bold text-sm">{formatCurrency(order.total_amount)}</p>
        </div>
      </div>

      {/* Assinatura do Entregador + QR Code */}
      <div className="mt-10 pt-4 border-t border-black border-dashed flex justify-between items-end">
        <div className="w-3/5">
          <p className="text-[9px] uppercase tracking-wider font-bold mb-8">Assinatura do Entregador</p>
          <div className="border-t border-black w-full mb-1"></div>
          <p className="text-[8px] text-gray-500">Assinatura</p>
          <p className="text-[8px] text-gray-500 mt-2">Data: ____ / ____ / ________</p>
        </div>
        <div className="text-center">
           <img 
             src={getQrCodeUrl(order.id)} 
             alt="QR Code" 
             width={60} 
             height={60} 
             className="border border-gray-200 p-0.5"
           />
           <p className="text-[7px] text-gray-500 mt-0.5 font-mono">Rastreio</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CONTEÚDO COMPLETO
// ============================================================
function PrintContent({ order }: { order: Order }) {
  return (
    <div className="bg-white">
      <div className="page-break-after">
        <ViaCompras order={order} />
      </div>
      <div className="page-break-after">
        <ViaCliente order={order} />
      </div>
      <div>
        <ViaAdministrativo order={order} />
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function PrintOrder({
  order,
  isOpen,
  onClose,
}: PrintOrderProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
  contentRef: componentRef,
  documentTitle: `Pedido-${formatOrderNumber(order.id)}`,
  onBeforePrint: () => {
    // Atrasa 1 segundo para garantir que o QR Code carregue
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  },
  onAfterPrint: () => {
    console.log('✅ Impressão concluída');
  },
  onPrintError: (errorLocation, error) => {
    console.error('❌ Erro na impressão:', errorLocation, error);
    alert('Erro ao imprimir. Verifique a impressora.');
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
              <h2 className="text-xl font-bold text-[#2d6a4f]">Imprimir Pedido</h2>
              <p className="text-xs text-gray-500">3 vias (80mm Térmica)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 flex justify-center">
          <div
            ref={componentRef}
            className="bg-white shadow-lg"
            style={{ width: '80mm', minHeight: '100mm' }}
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

      {/* CSS de Impressão Corrigido */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          /* Esconde o body original, mas deixa o portal de impressão visível */
          body {
            visibility: hidden;
          }

          /* O react-to-print cria um container temporário, precisamos garantir que ele apareça */
          body > div:has(.page-break-after) {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 0;
          }

          .page-break-after {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}