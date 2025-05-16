"use client";

import React from "react";

interface PaginationWithCustomRowsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  startIndex?: number;
  endIndex?: number;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
}

export default function PaginationWithCustomRows({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  startIndex = 0,
  endIndex = 0,
  rowsPerPage = 5,
  onRowsPerPageChange,
}: PaginationWithCustomRowsProps) {
  return (
    <div className="flex justify-end items-center space-x-4 text-sm">
      {onRowsPerPageChange && (
        <div className="flex items-center">
          <span className="mr-2 text-gray-700">Rows per page:</span>
          <div className="relative inline-block">
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 text-gray-900 bg-white hover:border-[#FF0059] focus:outline-none focus:ring-1 focus:ring-[#FF0059] focus:border-[#FF0059] transition-colors min-w-[65px] appearance-none pr-8"
              value={rowsPerPage}
              onChange={(e) => {
                onRowsPerPageChange(parseInt(e.target.value));
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="h-4 w-4 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {totalItems > 0 && (
        <div className="text-gray-700 font-medium">
          {`${startIndex + 1}-${endIndex} of ${totalItems}`}
        </div>
      )}

      <div className="flex items-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1.5 ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-[#FF0059] hover:bg-opacity-10 hover:text-[#FF0059]"
          } rounded-full transition-colors`}
          aria-label="Previous page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1.5 ml-1 ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-[#FF0059] hover:bg-opacity-10 hover:text-[#FF0059]"
          } rounded-full transition-colors`}
          aria-label="Next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
