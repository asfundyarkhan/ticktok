"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../lib/firebase/firebase';

interface DocumentData {
  id: string;
  data: Record<string, unknown>;
}

interface CollectionData {
  name: string;
  size: number;
  docs: DocumentData[];
}

export default function FirebaseTest() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testFirebase = async () => {
      try {
        console.log('Testing Firebase connection...');
        
        // Test adminStock collection
        const adminStockRef = collection(firestore, 'adminStock');
        const adminStockSnapshot = await getDocs(adminStockRef);
        console.log('AdminStock collection size:', adminStockSnapshot.size);
        
        // Test sellerListings collection
        const listingsRef = collection(firestore, 'sellerListings');
        const listingsSnapshot = await getDocs(listingsRef);
        console.log('SellerListings collection size:', listingsSnapshot.size);
        
        // Test users collection
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        console.log('Users collection size:', usersSnapshot.size);
        
        const results = [
          {
            name: 'adminStock',
            size: adminStockSnapshot.size,
            docs: adminStockSnapshot.docs.map(doc => ({
              id: doc.id,
              data: doc.data()
            }))
          },
          {
            name: 'sellerListings',
            size: listingsSnapshot.size,
            docs: listingsSnapshot.docs.map(doc => ({
              id: doc.id,
              data: doc.data()
            }))
          },
          {
            name: 'users',
            size: usersSnapshot.size,
            docs: usersSnapshot.docs.map(doc => ({
              id: doc.id,
              data: {
                email: doc.data().email,
                role: doc.data().role,
                displayName: doc.data().displayName
              }
            }))
          }
        ];
        
        setCollections(results);
        
      } catch (err) {
        console.error('Firebase test error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testFirebase();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Testing Firebase connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">Firebase Error</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-500 text-sm sm:text-base break-words">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Firebase Connection Test</h1>
      
        {collections.map((collection) => (
          <div key={collection.name} className="mb-8 bg-white border rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">
                Collection: {collection.name} ({collection.size} documents)
              </h2>
            </div>
            
            <div className="p-4 sm:p-6">
              {collection.size === 0 ? (
                <p className="text-gray-500 italic text-sm sm:text-base">No documents found in this collection</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-2 sm:px-4 py-2 border text-left text-xs sm:text-sm font-medium">Document ID</th>
                          <th className="px-2 sm:px-4 py-2 border text-left text-xs sm:text-sm font-medium">Sample Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collection.docs.slice(0, 5).map((doc: DocumentData, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-4 py-2 border font-mono text-xs break-all align-top">{doc.id}</td>
                            <td className="px-2 sm:px-4 py-2 border align-top">
                              <div className="max-w-xs sm:max-w-md">
                                <pre className="text-xs overflow-auto max-h-32 bg-gray-50 p-2 rounded whitespace-pre-wrap break-words">
                                  {JSON.stringify(doc.data, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {collection.size > 5 && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">
                      Showing first 5 of {collection.size} documents
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
