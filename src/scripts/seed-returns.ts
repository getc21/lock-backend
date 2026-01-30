import mongoose from 'mongoose';
import { ReturnRequest, ReturnStatus, ReturnType } from '../models/ReturnRequest';
import { Order } from '../models/Order';
import dotenv from 'dotenv';

dotenv.config();

async function seedReturns() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp';
    await mongoose.connect(mongoUri);
    console.log('✓ Conectado a MongoDB');

    // Obtener una tienda (usar ID hardcodeado o obtener la primera)
    const storeId = '696005eb54623baf4ce6f4d5';  // El storeId que usa el frontend
    
    // Obtener o crear una orden
    let order = await Order.findOne({ storeId });
    if (!order) {
      order = await Order.create({
        orderDate: new Date(),
        totalOrden: 500,
        paymentMethod: 'efectivo',
        storeId: new mongoose.Types.ObjectId(storeId),
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: 250,
          },
        ],
      });
      console.log('✓ Orden de prueba creada');
    }

    console.log(`Usando Orden: ${order._id}`);

    // Limpiar devoluciones existentes para esta tienda
    await ReturnRequest.deleteMany({ storeId });
    console.log('✓ Devoluciones previas eliminadas');

    // Crear devoluciones de prueba
    const returns = [
      {
        storeId: new mongoose.Types.ObjectId(storeId),
        orderId: order._id,
        orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        customerId: new mongoose.Types.ObjectId(),
        customerName: 'Juan Pérez',
        customerContact: 'juan@example.com',
        type: ReturnType.RETURN,
        status: ReturnStatus.PENDING,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            originalQuantity: 2,
            returnQuantity: 1,
            unitPrice: 150,
            returnReason: 'Producto defectuoso',
          },
        ],
        returnReasonCategory: 'defective',
        returnReasonDetails: 'El producto llegó con defecto en la costura',
        totalRefundAmount: 150,
        refundMethod: 'efectivo',
        requestedBy: new mongoose.Types.ObjectId(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        storeId: new mongoose.Types.ObjectId(storeId),
        orderId: order._id,
        orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        customerId: new mongoose.Types.ObjectId(),
        customerName: 'María García',
        customerContact: 'maria@example.com',
        type: ReturnType.EXCHANGE,
        status: ReturnStatus.APPROVED,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            originalQuantity: 1,
            returnQuantity: 1,
            unitPrice: 200,
            returnReason: 'Cambio de talla',
          },
        ],
        returnReasonCategory: 'wrong_item',
        returnReasonDetails: 'El tamaño no es el solicitado',
        totalRefundAmount: 200,
        refundMethod: 'tarjeta',
        requestedBy: new mongoose.Types.ObjectId(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        storeId: new mongoose.Types.ObjectId(storeId),
        orderId: order._id,
        orderNumber: `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        customerId: new mongoose.Types.ObjectId(),
        customerName: 'Carlos López',
        customerContact: 'carlos@example.com',
        type: ReturnType.RETURN,
        status: ReturnStatus.COMPLETED,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            originalQuantity: 3,
            returnQuantity: 2,
            unitPrice: 100,
            returnReason: 'Cliente cambió de opinión',
          },
        ],
        returnReasonCategory: 'customer_change_mind',
        returnReasonDetails: 'El cliente decidió no quedarse con el producto',
        totalRefundAmount: 200,
        refundMethod: 'transferencia',
        requestedBy: new mongoose.Types.ObjectId(),
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
    ];

    const created = await ReturnRequest.insertMany(returns);
    console.log(`✓ ${created.length} devoluciones de prueba creadas`);

    console.log('\n✅ Seed completado exitosamente');
    console.log(`\n📊 Resumen:`);
    console.log(`  - Tienda ID: ${storeId}`);
    console.log(`  - Orden ID: ${order._id}`);
    console.log(`  - Devoluciones creadas: ${created.length}`);

  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Desconectado de MongoDB');
  }
}

seedReturns();
