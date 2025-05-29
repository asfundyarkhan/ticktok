// Firestore service for products
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
} from "firebase/firestore";
import { firestore, storage } from "../lib/firebase/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { Product } from "../types/product";

// Re-export Product for backward compatibility
export type { Product };

export class ProductService {
  static COLLECTION = "products";

  // Create a product
  static async createProduct(product: Omit<Product, "id">): Promise<string> {
    try {
      const productsRef = collection(firestore, this.COLLECTION);
      const docRef = await addDoc(productsRef, {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  // Get a product by ID
  static async getProduct(id: string): Promise<Product | null> {
    try {
      const docRef = doc(firestore, this.COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as unknown as Product;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting product:", error);
      throw error;
    }
  }

  // Update a product
  static async updateProduct(
    id: string,
    data: Partial<Product>
  ): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  // Delete a product
  static async deleteProduct(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  // Get all products
  static async getAllProducts(): Promise<Product[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as unknown as Product);
      });

      return products;
    } catch (error) {
      console.error("Error getting all products:", error);
      throw error;
    }
  }

  // Get products by seller
  static async getProductsBySeller(sellerId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as unknown as Product);
      });

      return products;
    } catch (error) {
      console.error("Error getting products by seller:", error);
      throw error;
    }
  }

  // Get listed products (paginated)
  static async getListedProducts(
    pageSize: number = 10,
    lastDoc?: DocumentSnapshot
  ): Promise<{ products: Product[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q;

      if (lastDoc) {
        q = query(
          collection(firestore, this.COLLECTION),
          where("listed", "==", true),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(firestore, this.COLLECTION),
          where("listed", "==", true),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as unknown as Product);
      });

      const lastVisible =
        querySnapshot.docs.length > 0
          ? querySnapshot.docs[querySnapshot.docs.length - 1]
          : null;

      return {
        products,
        lastDoc: lastVisible,
      };
    } catch (error) {
      console.error("Error getting listed products:", error);
      throw error;
    }
  }

  // Get products by category
  static async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("category", "==", category),
        where("listed", "==", true),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as unknown as Product);
      });

      return products;
    } catch (error) {
      console.error("Error getting products by category:", error);
      throw error;
    }
  }

  // Search products
  static async searchProducts(term: string): Promise<Product[]> {
    // Note: Basic Firestore doesn't support text search
    // For production, consider Firebase extensions like Algolia
    // This is a simple implementation that searches by name prefix
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("name", ">=", term),
        where("name", "<=", term + "\uf8ff"),
        where("listed", "==", true),
        orderBy("name"),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const products: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as unknown as Product);
      });

      return products;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  }
  // Upload product image
  static async uploadProductImage(
    file: File,
    productId: string
  ): Promise<string> {
    try {
      const storageRef = ref(storage, `products/${productId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          "Access-Control-Allow-Origin": "*",
          uploadedBy: "ticktok-shop",
          productId: productId,
          uploadTimestamp: Date.now().toString(),
        },
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Optional: Track upload progress
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
          },
          (error) => {
            console.error("Upload failed:", error);

            // Check if it's a CORS error and provide fallback
            if (
              error.code === "storage/unauthorized" ||
              error.message.includes("CORS") ||
              error.message.includes("cross-origin")
            ) {
              console.warn("CORS error detected, using placeholder image");
              resolve("/images/placeholders/t-shirt.svg");
              return;
            }

            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error("Error getting download URL:", error);
              // Fallback to placeholder if download URL fails
              resolve("/images/placeholders/t-shirt.svg");
            }
          }
        );
      });
    } catch (error) {
      console.error("Error uploading product image:", error);

      // Check if it's a CORS-related error
      if (
        error instanceof Error &&
        (error.message.includes("CORS") ||
          error.message.includes("cross-origin") ||
          error.message.includes("unauthorized"))
      ) {
        console.warn("CORS error in upload setup, using placeholder image");
        return "/images/placeholders/t-shirt.svg";
      }

      throw error;
    }
  }
}
