export function checkoutTotal(subtotalCents) {
  const deliveryCents = subtotalCents >= 5000 ? 0 : 500;
  return { subtotalCents, deliveryCents, totalCents: subtotalCents + deliveryCents };
}
