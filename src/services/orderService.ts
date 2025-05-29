// Firestore service for orders
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";
import { Product } from "../types/product";

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id?: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "credit" | "balance" | "cod";
  paymentStatus: "pending" | "paid" | "refunded";
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export class OrderService {
  static COLLECTION = "orders";

  // Create a new order
  static async createOrder(order: Omit<Order, "id">): Promise<string> {
    try {
      const ordersRef = collection(firestore, this.COLLECTION);
      const docRef = await addDoc(ordersRef, {
        ...order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  // Get an order by ID
  static async getOrder(id: string): Promise<Order | null> {
    try {
      const docRef = doc(firestore, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Order;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting order:", error);
      throw error;
    }
  }

  // Get all orders for a user
  static async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Order);
      });

      return orders;
    } catch (error) {
      console.error("Error getting user orders:", error);
      throw error;
    }
  }

  // Get all orders for a seller's products
  static async getSellerOrders(sellerId: string): Promise<Order[]> {
    try {
      // This is a simplified implementation
      // In a real app, you'd structure the data differently or use a Cloud Function
      // to efficiently query orders containing products from a specific seller

      // Get all orders
      const querySnapshot = await getDocs(
        collection(firestore, this.COLLECTION)
      );
      const orders: Order[] = [];

      // Filter orders containing products from this seller
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        const order = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Order;

        // Check if any item in this order is from the seller
        const containsSellerItems = order.items.some((item) => {
          // You'll need to structure your order items to include sellerId
          // or fetch the product details for each item
          return item.sellerId === sellerId;
        });

        if (containsSellerItems) {
          orders.push(order);
        }
      }

      return orders;
    } catch (error) {
      console.error("Error getting seller orders:", error);
      throw error;
    }
  }

  // Update order status
  static async updateOrderStatus(
    id: string,
    status: Order["status"],
    paymentStatus?: Order["paymentStatus"]
  ): Promise<void> {
    try {
      const orderRef = doc(firestore, this.COLLECTION, id);
      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // Process order and update inventory
  static async processOrder(order: Omit<Order, "id">): Promise<string> {
    // In a production app, this should be a transaction
    // to ensure atomicity of order creation and inventory update
    try {
      // Create the order first
      const orderId = await this.createOrder(order);

      // Update product inventory for each item
      for (const item of order.items) {
        // Get the product reference
        const productRef = doc(firestore, "products", item.productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const product = productSnap.data() as Product;
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);

          // Update the product stock
          await updateDoc(productRef, {
            stock: newStock,
            updatedAt: Timestamp.now(),
          });
        }
      }

      return orderId;
    } catch (error) {
      console.error("Error processing order:", error);
      throw error;
    }
  }
}
