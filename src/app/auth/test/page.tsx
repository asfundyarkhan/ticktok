"use client";

import { useState } from "react";
import {
  collection,
  query,
  getDocs,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";

export default function TestAuthPage() {
  const { signIn, signUp, logout, user, userProfile, loading, error } =
    useFirebaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Signing in...");
    try {
      await signIn(email, password);
      setStatus("Signed in successfully!");    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Signing up...");
    try {
      await signUp(email, password, name);
      setStatus("Signed up successfully!");    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
    }
  };

  const handleLogout = async () => {
    setStatus("Logging out...");
    try {
      await logout();
      setStatus("Logged out successfully!");
    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
    }
  };

  const checkUserInFirestore = async (uid: string) => {
    try {
      setStatus("Checking user in Firestore...");
      const userRef = doc(firestore, "users", uid);
      const userDoc = await getDoc(userRef);      if (userDoc.exists()) {
        setStatus("User exists in Firestore!");
        setSelectedUser(userDoc.data() as any);
      } else {
        setStatus("User NOT found in Firestore.");
        setSelectedUser(null);
      }
    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
    }
  };

  const fetchUsers = async () => {
    try {
      setStatus("Fetching users from Firestore...");
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("role", "==", "user"));
      const querySnapshot = await getDocs(q);      const users: typeof dbUsers = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      setDbUsers(users);
      setStatus(`Found ${users.length} users in Firestore.`);
    } catch (error) {
      setStatus(`Error: ${(error as Error).message}`);
      setDbUsers([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow-lg my-10">
      <h1 className="text-2xl font-bold mb-6">Firebase Authentication Test</h1>

      {/* Current user info */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Current User</h2>
        {loading ? (
          <p>Loading...</p>
        ) : user ? (
          <div>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>UID:</strong> {user.uid}
            </p>
            <p>
              <strong>Display Name:</strong> {user.displayName || "Not set"}
            </p>
            <hr className="my-2" />
            <h3 className="font-medium">User Profile from Firestore:</h3>
            {userProfile ? (
              <pre className="bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            ) : (
              <p>No Firestore profile found.</p>
            )}
            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
              <button
                onClick={() => checkUserInFirestore(user.uid)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ml-2"
              >
                Verify in Firestore
              </button>
            </div>
          </div>
        ) : (
          <p>No user is signed in.</p>
        )}
      </div>

      {/* Authentication forms */}
      {!user && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Sign In Form */}
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-4">Sign In</h2>
            <form onSubmit={handleSignIn}>
              <div className="mb-4">
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign In
              </button>
            </form>
          </div>

          {/* Sign Up Form */}
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-4">Sign Up</h2>
            <form onSubmit={handleSignUp}>
              <div className="mb-4">
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Sign Up
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Database Users Section */}
      <div className="mt-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Firestore Users</h2>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Fetch Users from Firestore
        </button>

        {dbUsers.length > 0 && (
          <div className="mt-4 overflow-auto">
            <table className="w-full border-collapse">
              <thead>                <tr className="bg-gray-100">
                  <th className="p-2 border">UID</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Display Name</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dbUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="p-2 border truncate max-w-[100px]">
                      {user.uid}
                    </td>
                    <td className="p-2 border">{user.email}</td>
                    <td className="p-2 border">{user.displayName}</td>
                    <td className="p-2 border">{user.role}</td>
                    <td className="p-2 border">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected User Details */}
        {selectedUser && (
          <div className="mt-4 p-4 bg-gray-50 rounded border">
            <h3 className="font-semibold">User Details</h3>
            <pre className="mt-2 bg-white p-2 rounded overflow-auto text-sm">
              {JSON.stringify(selectedUser, null, 2)}
            </pre>
            <button
              onClick={() => setSelectedUser(null)}
              className="mt-2 px-3 py-1 bg-gray-600 text-white rounded text-sm"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {status && (
        <div className="mt-6 p-3 bg-gray-100 rounded">
          <h3 className="font-semibold">Status:</h3>
          <p>{status}</p>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-900 rounded">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
