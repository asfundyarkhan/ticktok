"use client";

import { SuperAdminRoute } from "../../../components/SuperAdminRoute";
import ProductInstanceMigration from "../../../components/ProductInstanceMigration";

export default function MigrationPage() {
  return (
    <SuperAdminRoute>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Product Migration Tools</h1>
          <p className="text-gray-600 mt-2">
            Administrative tools for migrating products to unique instances
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Important - Read Before Migrating
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  This migration tool solves the issue where multiple quantities of the same product 
                  share deposit receipt status. After migration:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Each product unit becomes a unique instance</li>
                  <li>Deposit receipts are tracked separately for each unit</li>
                  <li>Original products are marked as migrated but preserved</li>
                  <li>This operation cannot be easily undone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <ProductInstanceMigration />
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            After Migration
          </h3>
          <div className="text-sm text-blue-700">
            <p>Once migration is complete:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>New products added will automatically create unique instances</li>
              <li>Each product sale will be tracked individually</li>
              <li>Deposit receipts will be instance-specific</li>
              <li>No more data sharing between product units</li>
            </ul>
          </div>
        </div>
      </div>
    </SuperAdminRoute>
  );
}
