import { formatCents } from './amount.mjs';
export function exportRow(invoice) { return `${invoice.id},${formatCents(invoice.totalCents)}`; }
