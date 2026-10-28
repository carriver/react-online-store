import type { Product } from './cart';

export const PRODUCTS_URL = 'https://fakestoreapi.com/products';

const isProduct = (value: unknown): value is Product => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Number.isInteger(candidate.id) &&
    typeof candidate.price === 'number' &&
    Number.isFinite(candidate.price) &&
    candidate.price >= 0 &&
    ['title', 'description', 'category', 'image'].every((field) => typeof candidate[field] === 'string') &&
    /^https:\/\//.test(candidate.image as string)
  );
};

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(PRODUCTS_URL);
  if (!response.ok) throw new Error(`Product request failed with HTTP ${response.status}`);
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error('Product response was not a list');
  return body.filter(isProduct).sort((left, right) => left.id - right.id);
}

export const productsQuery = { queryKey: ['products'], queryFn: getProducts, staleTime: Infinity } as const;
