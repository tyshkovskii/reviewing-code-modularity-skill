import { rows } from './catalog/internal.mjs';
export const adminTitles = () => rows.filter((row) => !row.is_deleted).map((row) => row.title_text);
