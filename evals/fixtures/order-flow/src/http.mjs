export function submitHttp(body, io) {
  if (!Array.isArray(body.items) || body.items.length === 0) throw new Error('empty_order');
  if (body.items.some((item) => !Number.isInteger(item.cents) || item.cents < 0)) throw new Error('invalid_price');
  const totalCents = body.items.reduce((sum, item) => sum + item.cents, 0);
  const order = io.save({ customer: body.customer, totalCents });
  io.sendReceipt(order.id, totalCents);
  return { status: 201, body: { id: order.id, totalCents } };
}
