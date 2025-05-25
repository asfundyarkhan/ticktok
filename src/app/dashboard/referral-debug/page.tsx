"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { SuperAdminRoute } from "../../components/SuperAdminRoute";
import { UserService } from "../../../services/userService";
import { LoadingSpinner } from "../../components/Loading";

interface ReferralCode {
  uid: string;
  email: string;
  role: string;
  referralCode: string;
}

function ReferralDebugTool() {
  // The userProfile is required for authentication but not used in this component
  const { /* userProfile */ } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [testingCode, setTestingCode] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [customCodeResult, setCustomCodeResult] = useState<{isValid: boolean; adminUid?: string} | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  // Fetch all referral codes
  useEffect(() => {
    const fetchReferralCodes = async () => {
      try {
        setLoading(true);
        const codes = await UserService.getAllReferralCodes();
        setReferralCodes(codes);
      } catch (err) {
        console.error("Failed to fetch referral codes:", err);
        setError("Could not load referral codes. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferralCodes();
  }, []);
  
  // Test validation for a specific code
  const testValidation = async (code: string) => {
    try {
      setTestingCode(code);
      const result = await UserService.validateReferralCode(code);
      setValidationResults(prev => ({
        ...prev,
        [code]: result.isValid
      }));
    } catch (error) {
      console.error("Error testing code:", error);
    } finally {
      setTestingCode(null);
    }
  };
  
  // Test a custom code
  const testCustomCode = async () => {
    if (!customCode.trim()) return;
    
    try {
      setIsTesting(true);
      const result = await UserService.validateReferralCode(customCode.trim());
      setCustomCodeResult(result);
    } catch (error) {
      console.error("Error testing custom code:", error);
      setCustomCodeResult(null);
    } finally {
      setIsTesting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Referral Code Debug Tool</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-medium mb-3">Test Custom Referral Code</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            placeholder="Enter a referral code to test"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={testCustomCode}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isTesting ? "Testing..." : "Test Code"}
          </button>
        </div>
        
        {customCodeResult !== null && (
          <div className={`mt-3 p-3 rounded-md ${customCodeResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p>
              <strong>Result:</strong> {customCodeResult.isValid ? 'Valid' : 'Invalid'} referral code
            </p>
            {customCodeResult.isValid && customCodeResult.adminUid && (
              <p><strong>Admin ID:</strong> {customCodeResult.adminUid}</p>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
          <h2 className="text-lg font-medium">All Referral Codes in System ({referralCodes.length})</h2>
        </div>
        
        {referralCodes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No referral codes found in the system
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral Code</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referralCodes.map((code) => (
                  <tr key={code.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {code.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        code.role === 'admin' || code.role === 'superadmin' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {code.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <code className="bg-gray-100 px-2 py-1 rounded">{code.referralCode}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {validationResults[code.referralCode] !== undefined ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          validationResults[code.referralCode] 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {validationResults[code.referralCode] ? 'Valid' : 'Invalid'}
                        </span>
                      ) : (
                        <button
                          onClick={() => testValidation(code.referralCode)}
                          disabled={testingCode === code.referralCode}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {testingCode === code.referralCode ? 'Testing...' : 'Test Validation'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with SuperAdminRoute for security
export default function ReferralDebugPage() {
  return (
    <SuperAdminRoute>
      <ReferralDebugTool />
    </SuperAdminRoute>
  );
}
