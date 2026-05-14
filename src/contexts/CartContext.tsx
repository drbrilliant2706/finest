import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: string;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => string;
}

const sameVariant = (a: { id: string; size?: string; color?: string }, b: { id: string; size?: string; color?: string }) =>
  a.id === b.id && (a.size || '') === (b.size || '') && (a.color || '') === (b.color || '');

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'af_cart_items';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / serialization errors
    }
  }, [items]);

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const qty = Math.max(1, Math.floor(quantity));
    setItems(prevItems => {
      const existingItem = prevItems.find(item => sameVariant(item, product));
      if (existingItem) {
        return prevItems.map(item =>
          sameVariant(item, product)
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[^\d.]/g, ''));
      return sum + (price * item.quantity);
    }, 0);
    return total.toLocaleString();
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};
