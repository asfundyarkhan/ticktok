export interface StockListing {
  id?: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  quantity: number;
  sellerId: string;
  sellerName?: string;
  productId: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isSale?: boolean;
  salePrice?: number;
}
