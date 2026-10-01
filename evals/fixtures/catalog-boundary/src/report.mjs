import { listProducts } from './catalog/index.mjs';
export function reportTitles() { return listProducts().map((product) => product.title); }
