import { rows } from './catalog/internal.mjs';
export const exportTitles = () => rows.filter((row) => !row.is_deleted).map((row) => row.title_text);
