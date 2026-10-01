export function submitCli(input, io) {
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error('empty_order');
  if (input.items.some((item) => !Number.isInteger(item.cents) || item.cents < 0)) throw new Error('invalid_price');
  const totalCents = input.items.reduce((sum, item) => sum + item.cents, 0);
  const order = io.save({ customer: input.customer, totalCents });
  io.sendReceipt(order.id, totalCents);
  return `Created ${order.id}: ${totalCents}`;
}
