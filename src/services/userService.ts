// Firestore service for users
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { firestore, storage } from '../lib/firebase/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  balance: number;
  role: 'user' | 'seller' | 'admin' | 'superadmin';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  static COLLECTION = 'users';

  // Get user by ID
  static async getUserById(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(firestore, this.COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as UserProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where('email', '==', email)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        return { 
          uid: userDoc.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as UserProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  // Create/Update user profile
  static async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      
      // Filter out any undefined values to prevent Firestore errors
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );
      
      // Convert Date objects to Firestore Timestamps
      const firestoreData = {
        ...filteredData,
        updatedAt: Timestamp.now()
      };
      
      await setDoc(userRef, firestoreData, { merge: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update user balance
  static async updateUserBalance(uid: string, amount: number): Promise<number> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userSnap.data() as UserProfile;
      const currentBalance = userData.balance || 0;
      const newBalance = currentBalance + amount;
      
      await updateDoc(userRef, {
        balance: newBalance,
        updatedAt: Timestamp.now()
      });
      
      return newBalance;
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }

  // Upload profile picture
  static async uploadProfilePicture(file: File, uid: string): Promise<string> {
    try {
      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `users/${uid}/profile.${fileExtension}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Optional: Track upload progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
          },
          (error) => {
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update user profile with new photo URL
            const userRef = doc(firestore, this.COLLECTION, uid);
            await updateDoc(userRef, {
              photoURL: downloadURL,
              updatedAt: Timestamp.now()
            });
            
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  // Check if a user is a seller
  static async isUserSeller(uid: string): Promise<boolean> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return false;
      }
      
      const userData = userSnap.data() as UserProfile;
      return userData.role === 'seller' || userData.role === 'admin';
    } catch (error) {
      console.error('Error checking if user is a seller:', error);
      throw error;
    }
  }

  // Upgrade user to seller role
  static async upgradeToSeller(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      await updateDoc(userRef, {
        role: 'seller',
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error upgrading user to seller:', error);
      throw error;
    }
  }
}
