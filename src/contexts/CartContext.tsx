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
import type { PackLevel } from "@/lib/packaging";

const CART_STORAGE_KEY = "victory_cart";

/** A cart line is uniquely identified by product + pack level. */
function sameLine(
  a: { productId: string; packLevel: PackLevel },
  b: { productId: string; packLevel: PackLevel }
) {
  return a.productId === b.productId && a.packLevel === b.packLevel;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => sameLine(i, action.payload));
      if (existing) {
        const newQty = Math.min(
          existing.quantity + action.payload.quantity,
          action.payload.maxPacks
        );
        return {
          items: state.items.map((i) =>
            sameLine(i, action.payload) ? { ...i, quantity: newQty } : i
          ),
        };
      }
      if (action.payload.quantity > action.payload.maxPacks) {
        return {
          items: [
            ...state.items,
            { ...action.payload, quantity: action.payload.maxPacks },
          ],
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => !sameLine(i, action.payload)) };
    case "UPDATE_QUANTITY": {
      const item = state.items.find((i) => sameLine(i, action.payload));
      if (!item) return state;
      if (action.payload.quantity <= 0) {
        return { items: state.items.filter((i) => !sameLine(i, action.payload)) };
      }
      const capped = Math.min(action.payload.quantity, item.maxPacks);
      return {
        items: state.items.map((i) =>
          sameLine(i, action.payload) ? { ...i, quantity: capped } : i
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
        // Tolerate carts saved before the packaging upgrade.
        parsed.items
          .filter((i) => i && i.productId && i.packLevel)
          .forEach((item) => dispatch({ type: "ADD_ITEM", payload: item }));
      }
    } catch {
      // corrupted storage, start fresh
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const total = state.items.reduce(
    (sum, i) => sum + i.pricePerPack * i.quantity,
    0
  );

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

export const addItem = (item: CartItem): CartAction => ({
  type: "ADD_ITEM",
  payload: item,
});
export const removeItem = (
  productId: string,
  packLevel: PackLevel
): CartAction => ({
  type: "REMOVE_ITEM",
  payload: { productId, packLevel },
});
export const updateQuantity = (
  productId: string,
  packLevel: PackLevel,
  quantity: number
): CartAction => ({
  type: "UPDATE_QUANTITY",
  payload: { productId, packLevel, quantity },
});
export const clearCart = (): CartAction => ({ type: "CLEAR_CART" });

export function useCartActions() {
  const { dispatch } = useCart();
  return {
    addItem: useCallback((item: CartItem) => dispatch(addItem(item)), [dispatch]),
    removeItem: useCallback(
      (id: string, level: PackLevel) => dispatch(removeItem(id, level)),
      [dispatch]
    ),
    updateQuantity: useCallback(
      (id: string, level: PackLevel, qty: number) =>
        dispatch(updateQuantity(id, level, qty)),
      [dispatch]
    ),
    clearCart: useCallback(() => dispatch(clearCart()), [dispatch]),
  };
}
