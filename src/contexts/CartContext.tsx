"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { CartItem, CartState, CartAction } from "@/types";

const CART_STORAGE_KEY = "victory_cart";

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      if (existing) {
        const newQty = existing.quantity + action.payload.quantity;
        if (newQty > action.payload.stock) return state;
        return {
          items: state.items.map((i) =>
            i.productId === action.payload.productId ? { ...i, quantity: newQty } : i
          ),
        };
      }
      if (action.payload.quantity > action.payload.stock) return state;
      return { items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.productId !== action.payload.productId) };
    case "UPDATE_QUANTITY": {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (!item) return state;
      if (action.payload.quantity <= 0)
        return { items: state.items.filter((i) => i.productId !== action.payload.productId) };
      if (action.payload.quantity > item.stock) return state;
      return {
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    }
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  itemCount: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartState;
        parsed.items.forEach((item) => dispatch({ type: "ADD_ITEM", payload: item }));
      }
    } catch {
      // corrupted storage, start fresh
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const total = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ state, dispatch, itemCount, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export const addItem = (item: CartItem): CartAction => ({ type: "ADD_ITEM", payload: item });
export const removeItem = (productId: string): CartAction => ({
  type: "REMOVE_ITEM",
  payload: { productId },
});
export const updateQuantity = (productId: string, quantity: number): CartAction => ({
  type: "UPDATE_QUANTITY",
  payload: { productId, quantity },
});
export const clearCart = (): CartAction => ({ type: "CLEAR_CART" });

export function useCartActions() {
  const { dispatch } = useCart();
  return {
    addItem: useCallback((item: CartItem) => dispatch(addItem(item)), [dispatch]),
    removeItem: useCallback((id: string) => dispatch(removeItem(id)), [dispatch]),
    updateQuantity: useCallback(
      (id: string, qty: number) => dispatch(updateQuantity(id, qty)),
      [dispatch]
    ),
    clearCart: useCallback(() => dispatch(clearCart()), [dispatch]),
  };
}
