import mongoose from 'mongoose';
import { Receipt } from '../models/Receipt';

/**
 * Genera un número de comprobante único y correlativo para una tienda
 * Formato: RCP-YYYY-STORE-NNNNNNN
 * Ejemplo: RCP-2026-001-0000001
 */
export async function generateReceiptNumber(
  storeId: string,
  session?: mongoose.ClientSession
): Promise<string> {
  const year = new Date().getFullYear();
  
  // Normalizar storeId a 3 dígitos
  const storeNumber = String(storeId).slice(-3).padStart(3, '0');

  // Obtener el último número de comprobante para esta tienda este año
  const lastReceipt = await Receipt.findOne({
    storeId: new mongoose.Types.ObjectId(storeId),
    issuedAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  })
    .sort({ receiptNumber: -1 })
    .session(session || null);

  let nextSequence = 1;

  if (lastReceipt && lastReceipt.receiptNumber) {
    // Extraer el número de secuencia del último comprobante
    const matches = lastReceipt.receiptNumber.match(/(\d{7})$/);
    if (matches && matches[1]) {
      nextSequence = parseInt(matches[1]) + 1;
    }
  }

  // Generar número con padding de 7 dígitos
  const receiptNumber = `RCP-${year}-${storeNumber}-${String(nextSequence).padStart(7, '0')}`;

  return receiptNumber;
}

/**
 * Obtiene estadísticas de comprobantes para una tienda
 */
export async function getReceiptStatistics(
  storeId: string,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = { storeId: new mongoose.Types.ObjectId(storeId) };

  if (startDate || endDate) {
    query.issuedAt = {};
    if (startDate) query.issuedAt.$gte = startDate;
    if (endDate) query.issuedAt.$lte = endDate;
  }

  const [
    totalIssued,
    totalCancelled,
    totalRevenue,
    paymentMethods
  ] = await Promise.all([
    Receipt.countDocuments({ ...query, status: 'issued' }),
    Receipt.countDocuments({ ...query, status: 'cancelled' }),
    Receipt.aggregate([
      { $match: { ...query, status: 'issued' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Receipt.aggregate([
      { $match: { ...query, status: 'issued' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ])
  ]);

  return {
    totalReceipts: totalIssued + totalCancelled,
    issuedCount: totalIssued,
    cancelledCount: totalCancelled,
    totalAmount: totalRevenue[0]?.total || 0,
    paymentMethods,
    period: {
      startDate: startDate || 'N/A',
      endDate: endDate || 'N/A'
    }
  };
}

/**
 * Cancela un comprobante (por devolución, error, etc.)
 */
export async function cancelReceipt(
  receiptId: string,
  reason: string,
  userId: string,
  session?: mongoose.ClientSession
): Promise<boolean> {
  const result = await Receipt.findByIdAndUpdate(
    receiptId,
    {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: `${reason} (Cancelado por: ${userId})`
    },
    { session, new: true }
  );

  return !!result;
}
