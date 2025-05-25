import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { firestore } from '../lib/firebase/firebase';

export interface InventoryItem {
  id?: string;
  name: string;
  description: string;
  stock: number;
  productCode: string;
  image: string;
  price: number;
  listed: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  userId?: string;
}

export class InventoryService {
  private static collectionName = 'inventory';

  static async getUserInventory(userId: string): Promise<InventoryItem[]> {
    try {
      const inventoryRef = collection(firestore, this.collectionName);
      const q = query(
        inventoryRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryItem));
    } catch (error) {
      console.error('Error fetching user inventory:', error);
      throw error;
    }
  }

  static async addInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const inventoryRef = collection(firestore, this.collectionName);
      const docRef = await addDoc(inventoryRef, {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }

  static async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    try {
      const itemRef = doc(firestore, this.collectionName, id);
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    try {
      const itemRef = doc(firestore, this.collectionName, id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  static subscribeToUserInventory(
    userId: string, 
    callback: (items: InventoryItem[]) => void
  ): () => void {
    const inventoryRef = collection(firestore, this.collectionName);
    const q = query(
      inventoryRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryItem));
      callback(items);
    });
  }
}