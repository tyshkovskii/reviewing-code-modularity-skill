import { rows } from './internal.mjs';
export const listProducts = () => rows.filter((row) => !row.is_deleted).map((row) => ({ id: row.code, title: row.title_text }));
