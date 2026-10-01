import { catalogRows } from './catalog/internal/rows.mjs';
export function exportTitles() {
  return catalogRows.filter((row) => row.deleted_at === null).map((row) => row.label_text);
}
