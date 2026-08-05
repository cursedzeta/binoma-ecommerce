-- Vincula el pedido con Checkout Pro.
--
-- mpPaymentId es UNIQUE a proposito: es la red de seguridad contra webhooks
-- duplicados. Mercado Pago reintenta las notificaciones, y si dos llegaran a
-- procesarse a la vez, la base rechaza la segunda en vez de descontar el stock
-- dos veces.

ALTER TABLE "Order" ADD COLUMN "mpPreferenceId" TEXT;

CREATE UNIQUE INDEX "Order_mpPaymentId_key" ON "Order"("mpPaymentId");
