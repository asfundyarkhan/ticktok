"use client";

import { useState } from "react";

interface Referral {
  name: string;
  email: string;
  refId: string;
  dateJoined: string;
  credit: number;
}

export default function ReferralsTable({
  referrals,
  searchQuery,
}: {
  referrals: Referral[];
  searchQuery: string;
}) {
  const filteredReferrals = referrals.filter(
    (referral) =>
      referral.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
            >
              NAME
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
            >
              REF ID
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
            >
              DATE JOINED
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-sm font-semibold text-gray-900"
            >
              CREDIT
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {filteredReferrals.map((referral) => (
            <tr key={referral.refId} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {referral.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {referral.email}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {referral.refId}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {referral.dateJoined}
              </td>
              <td className="px-6 py-4 text-right text-sm">
                <span
                  className={
                    referral.credit === 0
                      ? "text-gray-500"
                      : "text-gray-900 font-medium"
                  }
                >
                  ${referral.credit.toFixed(2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
