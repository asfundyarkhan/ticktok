# Maximum Update Depth Exceeded Fix Documentation

## Problem

The TikTok Shop application was experiencing "Maximum update depth exceeded" errors in several components, particularly in the stock and inventory pages. This error occurs when a component triggers an infinite update loop, typically from a setState call inside a useEffect with improper dependency management.

## Files Fixed

### 1. Stock Page (`src/app/stock/page.tsx`)

- **Issue**: The `defaultAdminProducts` array was defined inside the component and included in the useEffect dependency array, causing an infinite loop.
- **Fix**: Moved `defaultAdminProducts` outside of the render cycle by creating a `getDefaultAdminProducts` function and removed it from the dependency array.

```tsx
// Changed from:
const defaultAdminProducts: Product[] = [...];
useEffect(() => {
  // ...
}, [defaultAdminProducts]);

// To:
const getDefaultAdminProducts = (): Product[] => [...];
useEffect(() => {
  const defaultAdminProducts = getDefaultAdminProducts();
  // ...
}, []);
```

### 2. Inventory Page (`src/app/stock/inventory/page.tsx`)

- **Issue**: The component was updating localStorage whenever products changed, which potentially caused a re-render loop.
- **Fix**: Added useRef to track previous version of products and added a comparison to only update localStorage when products actually change.

```tsx
// Changed from:
useEffect(() => {
  if (products.length > 0 && typeof window !== "undefined") {
    window.localStorage.setItem("inventoryProducts", JSON.stringify(products));
  }
}, [products]);

// To:
const productsRef = useRef(products);
useEffect(() => {
  if (
    products.length > 0 &&
    typeof window !== "undefined" &&
    JSON.stringify(productsRef.current) !== JSON.stringify(products)
  ) {
    window.localStorage.setItem("inventoryProducts", JSON.stringify(products));
    productsRef.current = products;
  }
}, [products]);
```

### 3. UserBalanceContext (`src/app/components/UserBalanceContext.tsx`)

- **Issue**: The component was saving balance to localStorage on every render when the balance changed.
- **Fix**: Added useRef to track previous balance value and comparison to prevent unnecessary state updates.

```tsx
// Changed from:
useEffect(() => {
  if (isClient && !user) {
    setStoredBalance(balance);
  }
}, [balance, isClient, user]);

// To:
const prevBalanceRef = useRef(balance);
useEffect(() => {
  if (isClient && !user && prevBalanceRef.current !== balance) {
    setStoredBalance(balance);
    prevBalanceRef.current = balance;
  }
}, [balance, isClient, user]);
```

### 4. Listings Page (`src/app/stock/listings/page.tsx`)

- **Issue**: The component was using a very frequent interval (1000ms) to refresh listings, which could contribute to performance issues and state update loops.
- **Fix**: Increased the interval to 5000ms to reduce update frequency and improve performance.

```tsx
// Changed from:
const intervalId = setInterval(loadListingsDirectly, 1000);

// To:
const intervalId = setInterval(loadListingsDirectly, 5000);
```

## General Best Practices Implemented

1. **useRef for Previous Values**: Used refs to track previous state and prevent unnecessary updates.
2. **Deep Comparison**: Added JSON.stringify comparison for complex objects to avoid unnecessary re-renders.
3. **Optimized Intervals**: Increased timer intervals to reduce update frequency.
4. **Proper Dependency Arrays**: Ensured useEffect dependency arrays only contain the values actually used.
5. **Safe localStorage Access**: Used utility functions for localStorage access to handle errors and SSR.

## Testing

The fixes have been applied and the following areas should be tested:

1. Navigate to the stock page and ensure it loads without errors
2. Navigate to the inventory page and verify it works correctly
3. Check that adding/removing products from inventory works without loops
4. Verify that the listings page functions properly with the updated interval
5. Ensure localStorage is being properly updated without causing re-render loops

## Future Considerations

For any future components that manage state with localStorage or have complex state updates:

1. Use the new `useLocalStorageState` hook to manage state with localStorage:

   ```tsx
   const [products, setProducts] = useLocalStorageState<Product[]>(
     "inventoryProducts",
     []
   );
   ```

2. When not using the hook:

   - Always use `useRef` to track previous values for comparison
   - For complex objects, do deep comparisons before updating
   - Be cautious with useEffect dependency arrays to prevent loops

3. Consider using a state management library for more complex state needs

## Added Utilities

### useLocalStorageState Hook

A new utility hook was created to simplify localStorage state management and prevent update loops:

- Located at: `src/app/utils/useLocalStorageState.ts`
- Manages state and localStorage in sync
- Built-in protection against infinite update loops
- Supports all data types including objects and arrays
- Same API as React's useState

Example usage:

```tsx
// Import the hook
import { useLocalStorageState } from "../utils/useLocalStorageState";

// In your component
const [products, setProducts] = useLocalStorageState<Product[]>(
  "inventoryProducts",
  []
);

// Use just like useState
setProducts([...products, newProduct]);
```
