import { catalogRows } from './internal/rows.mjs';
export function listProducts() {
  return catalogRows.filter((row) => row.deleted_at === null).map((row) => ({ id: row.sku, title: row.label_text }));
}
