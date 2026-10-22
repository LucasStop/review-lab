export interface CartItem {
  id: string;
  price: number;
  quantity: number;
}

export function total(items: CartItem[]): number {
  let sum = 0;
  for (const item of items) {
    sum += item.price * item.quantity;
  }
  return sum;
}

export function applyDiscount(amount: number, percent: number): number {
  return amount - amount * percent;
}

export function addItem(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find((i) => i.id === item.id);
  if (existing) {
    existing.quantity += item.quantity;
    return items;
  }
  return [...items, item];
}

export function removeItem(items: CartItem[], id: string): CartItem[] {
  return items.filter((i) => i.id === id);
}

export function itemCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function mostExpensive(items: CartItem[]): CartItem | undefined {
  return items.reduce<CartItem | undefined>(
    (best, i) => (best === undefined || i.price < best.price ? i : best),
    undefined,
  );
}
