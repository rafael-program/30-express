// components/PrintOrder.tsx
'use client';

import { Printer } from 'lucide-react';
import { useState } from 'react';

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: any[];
  total_amount: number;
  delivery_fee: number;
  subtotal: number;
  status: string;
  payment_method: string;
  created_at: string;
  delivery_time: string;
  
  qr_code: string;
  updated_at?: string;
};

interface PrintOrderProps {
  order: Order;
  buttonText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export function PrintOrder({ 
  order, 
  buttonText = '🖨️ Imprimir',
  buttonVariant = 'primary',
  className = ''
}: PrintOrderProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      out_for_delivery: 'Em Rota',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const getPaymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      card: 'Cartão',
      mobile_money: 'Mobile Money'
    };
    return labels[method] || method;
  };

  const handlePrint = () => {
    setIsPrinting(true);

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      setIsPrinting(false);
      alert('Por favor, permita pop-ups para imprimir.');
      return;
    }

    // Gerar QR Code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${order.qr_code || order.order_number}`;

    // 🔥 HTML PARA IMPRESSORA TÉRMICA (80mm)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido ${order.order_number}</title>
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            body { 
              font-family: 'Courier New', monospace;
              font-size: 11px;
              width: 80mm;
              padding: 0;
              margin: 0 auto;
              background: white;
              color: #000;
            }
            
            /* Estilo geral para impressão térmica */
            .thermal-paper {
              width: 80mm;
              padding: 5px 8px;
              margin: 0 auto;
            }
            
            .center { text-align: center; }
            .right { text-align: right; }
            .left { text-align: left; }
            
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .header .store-name {
              font-size: 16px;
              font-weight: bold;
              letter-spacing: 2px;
            }
            .header .store-sub {
              font-size: 10px;
              color: #555;
            }
            .header .order-number {
              font-size: 14px;
              font-weight: bold;
              margin-top: 4px;
            }
            
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .divider-double {
              border-top: 2px solid #000;
              margin: 6px 0;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
              font-size: 10px;
            }
            .info-row .label { color: #555; }
            .info-row .value { font-weight: bold; }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
              font-size: 10px;
            }
            table th {
              text-align: left;
              border-bottom: 1px dashed #000;
              padding: 3px 0;
              font-size: 9px;
              text-transform: uppercase;
              color: #555;
            }
            table td {
              padding: 3px 0;
              border-bottom: 1px dotted #ddd;
            }
            table .qtd { text-align: center; width: 20%; }
            table .price { text-align: right; width: 25%; }
            table .total { text-align: right; width: 30%; }
            
            .totals {
              margin: 6px 0;
              padding: 4px 0;
            }
            .totals .row {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
              font-size: 10px;
            }
            .totals .grand-total {
              font-size: 14px;
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 4px;
              margin-top: 4px;
            }
            
            .qr-section {
              text-align: center;
              margin: 8px 0;
              padding: 6px;
              border: 1px dashed #999;
            }
            .qr-section img {
              max-width: 80px;
              max-height: 80px;
            }
            .qr-section .qr-label {
              font-size: 8px;
              color: #888;
              margin-top: 2px;
            }
            
            .signature {
              margin: 10px 0;
              padding-top: 6px;
              border-top: 1px dashed #000;
            }
            .signature .line {
              display: flex;
              justify-content: space-between;
              margin-top: 4px;
            }
            .signature .line span {
              border-bottom: 1px solid #000;
              min-width: 80px;
              padding-bottom: 2px;
              font-size: 9px;
            }
            
            .footer {
              text-align: center;
              font-size: 8px;
              color: #888;
              margin-top: 8px;
              padding-top: 6px;
              border-top: 1px dashed #ddd;
            }
            
            .copy-badge {
              display: inline-block;
              font-size: 8px;
              padding: 2px 6px;
              border: 1px solid #000;
              border-radius: 2px;
              margin: 4px 0;
            }
            
            .page-break {
              page-break-after: always;
              border-bottom: 3px double #000;
              margin-bottom: 8px;
              padding-bottom: 8px;
            }
            
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="thermal-paper">
            
            <!-- ============================================ -->
            <!-- CÓPIA 1 - EQUIPE DE COMPRAS -->
            <!-- ============================================ -->
            <div class="page-break">
              <div class="header">
                <div class="store-name">🏪 30 EXPRESS</div>
                <div class="store-sub">MERCADO 30 - DELIVERY</div>
                <div class="copy-badge">🔵 CÓPIA 1 - COMPRAS</div>
                <div class="order-number"># ${order.order_number}</div>
              </div>

              <div class="info-row">
                <span class="label">Cliente:</span>
                <span class="value">${order.customer_name || 'Cliente'}</span>
              </div>
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">${order.customer_phone || '-'}</span>
              </div>
              <div class="info-row">
                <span class="label">Endereço:</span>
                <span class="value" style="font-size:9px;">${order.customer_address || '-'}</span>
              </div>
              <div class="divider"></div>
              <div class="info-row">
                <span class="label">Data:</span>
                <span class="value">${formatDate(order.created_at)}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">${getStatusLabel(order.status)}</span>
              </div>
              <div class="info-row">
                <span class="label">Pagamento:</span>
                <span class="value">${getPaymentLabel(order.payment_method)}</span>
              </div>
              <div class="divider"></div>

              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th class="qtd">Qtd</th>
                    <th class="price">Preço</th>
                    <th class="total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items && order.items.length > 0 ? order.items.map((item: any) => `
                    <tr>
                      <td style="font-size:9px;">${item.product_name || 'Produto'}</td>
                      <td class="qtd">${item.quantity || 1}</td>
                      <td class="price">${formatCurrency(item.unit_price || item.price || 0)}</td>
                      <td class="total">${formatCurrency((item.unit_price || item.price || 0) * (item.quantity || 1))}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="4" style="text-align:center; color:#999;">Nenhum item</td>
                    </tr>
                  `}
                </tbody>
              </table>

              <div class="divider-double"></div>
              <div class="totals">
                <div class="row">
                  <span>Subtotal</span>
                  <span>${formatCurrency(order.subtotal || 0)}</span>
                </div>
                <div class="row">
                  <span>Taxa Entrega</span>
                  <span>${formatCurrency(order.delivery_fee || 0)}</span>
                </div>
                <div class="row grand-total">
                  <span>TOTAL</span>
                  <span>${formatCurrency(order.total_amount || 0)}</span>
                </div>
              </div>

              <div class="qr-section">
                <img src="${qrCodeUrl}" alt="QR" />
                <div class="qr-label">${order.qr_code || order.order_number}</div>
              </div>

              <div class="signature">
                <div class="line">
                  <span>Entregador</span>
                  <span>Cliente</span>
                </div>
              </div>

              <div class="footer">
                30 Express • ${formatDate(new Date().toISOString())}
              </div>
            </div>

            <!-- ============================================ -->
            <!-- CÓPIA 2 - CLIENTE -->
            <!-- ============================================ -->
            <div class="page-break">
              <div class="header">
                <div class="store-name">🏪 30 EXPRESS</div>
                <div class="store-sub">MERCADO 30 - DELIVERY</div>
                <div class="copy-badge">🟢 CÓPIA 2 - CLIENTE</div>
                <div class="order-number"># ${order.order_number}</div>
              </div>

              <div class="info-row">
                <span class="label">Cliente:</span>
                <span class="value">${order.customer_name || 'Cliente'}</span>
              </div>
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">${order.customer_phone || '-'}</span>
              </div>
              <div class="info-row">
                <span class="label">Endereço:</span>
                <span class="value" style="font-size:9px;">${order.customer_address || '-'}</span>
              </div>
              <div class="divider"></div>

              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th class="qtd">Qtd</th>
                    <th class="price">Preço</th>
                    <th class="total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items && order.items.length > 0 ? order.items.map((item: any) => `
                    <tr>
                      <td style="font-size:9px;">${item.product_name || 'Produto'}</td>
                      <td class="qtd">${item.quantity || 1}</td>
                      <td class="price">${formatCurrency(item.unit_price || item.price || 0)}</td>
                      <td class="total">${formatCurrency((item.unit_price || item.price || 0) * (item.quantity || 1))}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="4" style="text-align:center; color:#999;">Nenhum item</td>
                    </tr>
                  `}
                </tbody>
              </table>

              <div class="divider-double"></div>
              <div class="totals">
                <div class="row">
                  <span>Subtotal</span>
                  <span>${formatCurrency(order.subtotal || 0)}</span>
                </div>
                <div class="row">
                  <span>Taxa Entrega</span>
                  <span>${formatCurrency(order.delivery_fee || 0)}</span>
                </div>
                <div class="row grand-total">
                  <span>TOTAL</span>
                  <span>${formatCurrency(order.total_amount || 0)}</span>
                </div>
              </div>

              <div class="qr-section">
                <img src="${qrCodeUrl}" alt="QR" />
                <div class="qr-label">${order.qr_code || order.order_number}</div>
              </div>

              <div class="signature">
                <div class="line">
                  <span>Cliente</span>
                </div>
              </div>

              <div class="footer">
                30 Express • ${formatDate(new Date().toISOString())}
              </div>
            </div>

            <!-- ============================================ -->
            <!-- CÓPIA 3 - ADMINISTRATIVO -->
            <!-- ============================================ -->
            <div>
              <div class="header">
                <div class="store-name">🏪 30 EXPRESS</div>
                <div class="store-sub">MERCADO 30 - DELIVERY</div>
                <div class="copy-badge">🔴 CÓPIA 3 - ADMIN</div>
                <div class="order-number"># ${order.order_number}</div>
              </div>

              <div class="info-row">
                <span class="label">Cliente:</span>
                <span class="value">${order.customer_name || 'Cliente'}</span>
              </div>
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">${order.customer_phone || '-'}</span>
              </div>
              <div class="info-row">
                <span class="label">Endereço:</span>
                <span class="value" style="font-size:9px;">${order.customer_address || '-'}</span>
              </div>
              <div class="divider"></div>

              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th class="qtd">Qtd</th>
                    <th class="price">Preço</th>
                    <th class="total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items && order.items.length > 0 ? order.items.map((item: any) => `
                    <tr>
                      <td style="font-size:9px;">${item.product_name || 'Produto'}</td>
                      <td class="qtd">${item.quantity || 1}</td>
                      <td class="price">${formatCurrency(item.unit_price || item.price || 0)}</td>
                      <td class="total">${formatCurrency((item.unit_price || item.price || 0) * (item.quantity || 1))}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="4" style="text-align:center; color:#999;">Nenhum item</td>
                    </tr>
                  `}
                </tbody>
              </table>

              <div class="divider-double"></div>
              <div class="totals">
                <div class="row">
                  <span>Subtotal</span>
                  <span>${formatCurrency(order.subtotal || 0)}</span>
                </div>
                <div class="row">
                  <span>Taxa Entrega</span>
                  <span>${formatCurrency(order.delivery_fee || 0)}</span>
                </div>
                <div class="row grand-total">
                  <span>TOTAL</span>
                  <span>${formatCurrency(order.total_amount || 0)}</span>
                </div>
              </div>

              <div class="qr-section">
                <img src="${qrCodeUrl}" alt="QR" />
                <div class="qr-label">${order.qr_code || order.order_number}</div>
              </div>

              <div class="signature">
                <div class="line">
                  <span>Entregador</span>
                </div>
              </div>

              <div class="footer">
                30 Express • ${formatDate(new Date().toISOString())}
              </div>
            </div>

          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      setIsPrinting(false);
    }, 2000);
  };

  const getButtonStyles = () => {
    switch (buttonVariant) {
      case 'primary':
        return 'bg-[#2d6a4f] text-white hover:bg-[#1b4332]';
      case 'secondary':
        return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
      case 'outline':
        return 'border-2 border-[#2d6a4f] text-[#2d6a4f] hover:bg-[#2d6a4f] hover:text-white';
      default:
        return 'bg-[#2d6a4f] text-white hover:bg-[#1b4332]';
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className={`px-6 py-3 rounded-xl transition font-medium flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()} ${className}`}
    >
      {isPrinting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Imprimindo...
        </>
      ) : (
        <>
          <Printer className="w-4 h-4" />
          {buttonText}
        </>
      )}
    </button>
  );
}