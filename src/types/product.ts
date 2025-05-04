export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  category: string;
  rating: number;
  image: string;
  reviews: number;
  sizes?: string[];
  isSale?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  size?: string;
  color?: string;
}