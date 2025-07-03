import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../lib/firebase/firebase";

export class StorageService {
  /**
   * Upload a profile picture for a user
   * @param userId - The user's ID
   * @param file - The image file to upload
   * @returns Promise<string> - The download URL of the uploaded image
   */
  static async uploadProfilePicture(
    userId: string,
    file: File
  ): Promise<string> {
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file");
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("Image size must be less than 5MB");
      }

      // Create a unique filename
      const fileExtension = file.name.split(".").pop();
      const fileName = `profile_${userId}_${Date.now()}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, `profile-pictures/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  }

  /**
   * Delete a profile picture from storage
   * @param photoURL - The URL of the image to delete
   */
  static async deleteProfilePicture(photoURL: string): Promise<void> {
    try {
      // Extract the path from the URL
      const url = new URL(photoURL);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);

      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      // Don't throw error for deletion failures as it's not critical
    }
  }

  /**
   * Upload a general image file
   * @param folder - The folder to upload to
   * @param file - The image file to upload
   * @param customName - Optional custom name for the file
   * @returns Promise<string> - The download URL of the uploaded image
   */
  static async uploadImage(
    folder: string,
    file: File,
    customName?: string
  ): Promise<string> {
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file");
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("Image size must be less than 10MB");
      }

      // Create a unique filename
      const fileExtension = file.name.split(".").pop();
      const fileName = customName
        ? `${customName}.${fileExtension}`
        : `${Date.now()}_${file.name}`;

      // Create storage reference
      const storageRef = ref(storage, `${folder}/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }
}
