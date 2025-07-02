/**
 * Simple client-side debug script to check product navigation
 * Add this as a page to test product data
 */

"use client";

import { useState, useEffect } from 'react';
import { StockService } from '../../services/stockService';
import { StockItem } from '../../types/marketplace';

interface TestResult {
  name: string;
  id: string;
  productCode?: string;
  productId?: string;
  tests: {
    byId?: string;
    byCode?: string;
    inListings?: string;
  };
}

export default function DebugProducts() {
  const [products, setProducts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    const loadAndTestProducts = async () => {
      try {
        console.log('Loading all stock items...');
        const stockItems = await StockService.getAllStockItems();
        console.log('Loaded products:', stockItems);
        setProducts(stockItems);
        
        // Test each product's ID resolution
        const results: TestResult[] = [];
        for (const product of stockItems.slice(0, 3)) { // Test first 3 products
          if (!product.id) continue; // Skip products without IDs
          
          console.log(`Testing product: ${product.name} (ID: ${product.id})`);
          
          const result: TestResult = {
            name: product.name,
            id: product.id,
            productCode: product.productCode,
            productId: product.productId,
            tests: {}
          };
          
          // Test 1: Can we find it by ID?
          try {
            const byId = await StockService.getStockItem(product.id, false);
            result.tests.byId = byId ? 'FOUND' : 'NOT_FOUND';
            console.log(`  By ID: ${result.tests.byId}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.tests.byId = `ERROR: ${errorMessage}`;
            console.log(`  By ID: ERROR - ${errorMessage}`);
          }
          
          // Test 2: Can we find it by product code?
          if (product.productCode) {
            try {
              const byCode = await StockService.getStockItem(product.productCode, true);
              result.tests.byCode = byCode ? 'FOUND' : 'NOT_FOUND';
              console.log(`  By Code: ${result.tests.byCode}`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              result.tests.byCode = `ERROR: ${errorMessage}`;
              console.log(`  By Code: ERROR - ${errorMessage}`);
            }
          } else {
            result.tests.byCode = 'NO_CODE';
          }
          
          // Test 3: Check listings
          try {
            const listings = await StockService.searchListingsByProductId(product.id);
            result.tests.inListings = listings.length > 0 ? `FOUND_${listings.length}` : 'NOT_FOUND';
            console.log(`  In Listings: ${result.tests.inListings}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.tests.inListings = `ERROR: ${errorMessage}`;
            console.log(`  In Listings: ERROR - ${errorMessage}`);
          }
          
          results.push(result);
        }
        
        setTestResults(results);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAndTestProducts();
  }, []);

  if (loading) {
    return <div className="p-8">Loading products for testing...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Product ID Debug</h1>
      
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">All Products ({products.length})</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 sm:px-4 py-2 border text-left text-xs sm:text-sm">Name</th>
                  <th className="px-2 sm:px-4 py-2 border text-left text-xs sm:text-sm">Document ID</th>
                  <th className="px-2 sm:px-4 py-2 border text-left text-xs sm:text-sm">Product Code</th>
                  <th className="px-2 sm:px-4 py-2 border text-left text-xs sm:text-sm">Product ID</th>
                  <th className="px-2 sm:px-4 py-2 border text-left text-xs sm:text-sm">Listed</th>
                  <th className="px-2 sm:px-4 py-2 border text-left text-xs sm:text-sm">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">{product.name}</td>
                    <td className="px-2 sm:px-4 py-2 border font-mono text-xs break-all">{product.id}</td>
                    <td className="px-2 sm:px-4 py-2 border font-mono text-xs break-all">{product.productCode || 'N/A'}</td>
                    <td className="px-2 sm:px-4 py-2 border font-mono text-xs break-all">{product.productId || 'N/A'}</td>
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">{product.listed ? 'Yes' : 'No'}</td>
                    <td className="px-2 sm:px-4 py-2 border text-xs sm:text-sm">{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Navigation Tests</h2>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="bg-white p-4 border rounded-lg shadow">
                <h3 className="font-semibold text-sm sm:text-base">{result.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 break-all">ID: {result.id}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <strong className="mb-1 sm:mb-0 sm:mr-2">By ID:</strong> 
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.tests.byId === 'FOUND' ? 'bg-green-100 text-green-800' :
                      result.tests.byId === 'NOT_FOUND' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.tests.byId}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <strong className="mb-1 sm:mb-0 sm:mr-2">By Code:</strong> 
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.tests.byCode === 'FOUND' ? 'bg-green-100 text-green-800' :
                      result.tests.byCode === 'NOT_FOUND' || result.tests.byCode === 'NO_CODE' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.tests.byCode}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <strong className="mb-1 sm:mb-0 sm:mr-2">In Listings:</strong> 
                    <span className={`px-2 py-1 rounded text-xs ${
                      (result.tests.inListings || '').startsWith('FOUND') ? 'bg-green-100 text-green-800' :
                      result.tests.inListings === 'NOT_FOUND' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.tests.inListings}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
