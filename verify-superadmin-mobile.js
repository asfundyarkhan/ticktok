/**
 * Verification Script for Superadmin Mobile Optimization
 * Tests mobile responsiveness and functionality across all admin pages
 * Run this script to verify mobile optimization implementation
 */

const fs = require("fs");
const path = require("path");

// File paths to verify
const filesToCheck = [
  "src/app/dashboard/stock/page.tsx",
  "src/app/dashboard/admin/page.tsx",
  "src/app/dashboard/admin/buy/page.tsx",
  "src/app/dashboard/admin/receipts/page.tsx",
  "src/app/dashboard/admin/referrals/page.tsx",
  "src/app/dashboard/admin/all-referrals/page.tsx",
  "src/app/components/ReferralsTable.tsx",
];

// Mobile optimization patterns to verify
const mobilePatterns = {
  dualLayout: {
    pattern: /hidden lg:block|lg:hidden/,
    description: "Dual layout system (desktop table + mobile cards)",
  },
  responsiveText: {
    pattern: /text-xl sm:text-2xl|text-sm sm:text-base/,
    description: "Responsive typography scaling",
  },
  responsivePadding: {
    pattern: /p-4 sm:p-6|mb-4 sm:mb-6/,
    description: "Mobile-first responsive spacing",
  },
  responsiveFlex: {
    pattern: /flex-col sm:flex-row|w-full sm:w-auto/,
    description: "Responsive flex layouts",
  },
  mobileCards: {
    pattern: /bg-white.*border.*rounded-lg.*p-4/,
    description: "Mobile card layouts",
  },
  touchTargets: {
    pattern: /px-4 py-2|focus:ring-2|focus:ring-offset-2/,
    description: "Touch-friendly button sizing and focus states",
  },
};

// Functionality patterns to verify
const functionalityPatterns = {
  adminFunctions: {
    pattern: /onClick.*handleEdit|onClick.*handleDelete|onClick.*handleToggle/,
    description: "Admin management functions preserved",
  },
  formValidation: {
    pattern: /required|validation|error/,
    description: "Form validation maintained",
  },
  modalHandling: {
    pattern: /showModal|setShowModal|Modal/,
    description: "Modal functionality preserved",
  },
  searchFilter: {
    pattern: /searchQuery|filteredResults|onChange.*search/,
    description: "Search and filtering capabilities",
  },
  pagination: {
    pattern: /currentPage|totalPages|goToNextPage|goToPrevPage/,
    description: "Pagination controls",
  },
};

console.log("🔍 Verifying Superadmin Mobile Optimization Implementation\n");
console.log("=".repeat(60));

let overallScore = 0;
let totalChecks = 0;
const results = [];

// Check each file
filesToCheck.forEach((filePath) => {
  console.log(`\n📱 Checking: ${filePath}`);
  console.log("-".repeat(50));

  if (!fs.existsSync(filePath)) {
    console.log("❌ File not found!");
    results.push({ file: filePath, status: "MISSING", score: 0, maxScore: 0 });
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  let fileScore = 0;
  let fileMaxScore = 0;
  const fileResults = [];

  // Check mobile patterns
  console.log("\n🎨 Mobile Responsiveness:");
  Object.entries(mobilePatterns).forEach(([key, { pattern, description }]) => {
    const found = pattern.test(content);
    const score = found ? 1 : 0;
    fileScore += score;
    fileMaxScore += 1;
    totalChecks += 1;

    console.log(`  ${found ? "✅" : "❌"} ${description}`);
    fileResults.push({ type: "mobile", test: key, passed: found, description });
  });

  // Check functionality patterns
  console.log("\n⚙️  Functionality Preservation:");
  Object.entries(functionalityPatterns).forEach(
    ([key, { pattern, description }]) => {
      const found = pattern.test(content);
      const score = found ? 1 : 0;
      fileScore += score;
      fileMaxScore += 1;
      totalChecks += 1;

      console.log(`  ${found ? "✅" : "❌"} ${description}`);
      fileResults.push({
        type: "functionality",
        test: key,
        passed: found,
        description,
      });
    }
  );

  const filePercentage = Math.round((fileScore / fileMaxScore) * 100);
  console.log(
    `\n📊 File Score: ${fileScore}/${fileMaxScore} (${filePercentage}%)`
  );

  overallScore += fileScore;
  results.push({
    file: filePath,
    status:
      filePercentage >= 80
        ? "EXCELLENT"
        : filePercentage >= 60
        ? "GOOD"
        : "NEEDS_WORK",
    score: fileScore,
    maxScore: fileMaxScore,
    percentage: filePercentage,
    details: fileResults,
  });
});

// Calculate overall results
const maxPossibleScore = results.reduce((sum, r) => sum + r.maxScore, 0);
const overallPercentage = Math.round((overallScore / maxPossibleScore) * 100);

console.log("\n" + "=".repeat(60));
console.log("📋 OVERALL VERIFICATION RESULTS");
console.log("=".repeat(60));

console.log(
  `\n🎯 Overall Score: ${overallScore}/${maxPossibleScore} (${overallPercentage}%)`
);

// Status summary
const excellent = results.filter((r) => r.status === "EXCELLENT").length;
const good = results.filter((r) => r.status === "GOOD").length;
const needsWork = results.filter((r) => r.status === "NEEDS_WORK").length;
const missing = results.filter((r) => r.status === "MISSING").length;

console.log("\n📈 File Status Summary:");
console.log(`  ✅ Excellent (80%+): ${excellent} files`);
console.log(`  ✔️  Good (60-79%): ${good} files`);
console.log(`  ⚠️  Needs Work (<60%): ${needsWork} files`);
console.log(`  ❌ Missing: ${missing} files`);

// Detailed breakdown by category
console.log("\n🔍 Pattern Analysis:");
const mobileTests = results.flatMap(
  (r) => r.details?.filter((d) => d.type === "mobile") || []
);
const functionalityTests = results.flatMap(
  (r) => r.details?.filter((d) => d.type === "functionality") || []
);

const mobilePass = mobileTests.filter((t) => t.passed).length;
const functionalityPass = functionalityTests.filter((t) => t.passed).length;

console.log(
  `  📱 Mobile Responsiveness: ${mobilePass}/${
    mobileTests.length
  } (${Math.round((mobilePass / mobileTests.length) * 100)}%)`
);
console.log(
  `  ⚙️  Functionality Preservation: ${functionalityPass}/${
    functionalityTests.length
  } (${Math.round((functionalityPass / functionalityTests.length) * 100)}%)`
);

// Recommendations
console.log("\n💡 Recommendations:");
if (overallPercentage >= 90) {
  console.log(
    "  🎉 Excellent implementation! Mobile optimization is comprehensive."
  );
  console.log("  🔄 Consider user testing on actual mobile devices.");
} else if (overallPercentage >= 80) {
  console.log("  👍 Good implementation with room for minor improvements.");
  console.log(
    "  🔍 Review files with lower scores for optimization opportunities."
  );
} else if (overallPercentage >= 60) {
  console.log("  ⚠️  Implementation needs significant improvements.");
  console.log(
    "  🛠️  Focus on mobile responsiveness patterns and functionality preservation."
  );
} else {
  console.log("  ❌ Implementation needs major work.");
  console.log("  🔧 Review mobile optimization requirements and patterns.");
}

// Mobile testing checklist
console.log("\n📱 Manual Mobile Testing Checklist:");
console.log("  [ ] Test on actual mobile devices (iOS/Android)");
console.log("  [ ] Verify responsive layouts at different screen sizes");
console.log("  [ ] Test touch interactions and button accessibility");
console.log("  [ ] Verify all admin functions work on mobile");
console.log("  [ ] Check modal and form usability on small screens");
console.log("  [ ] Test search, filtering, and pagination on mobile");
console.log("  [ ] Verify performance and loading times");

// Next steps
console.log("\n🚀 Next Steps:");
console.log("  1. Address any failing verification tests");
console.log("  2. Conduct manual testing on mobile devices");
console.log("  3. Gather user feedback on mobile experience");
console.log("  4. Monitor performance metrics");
console.log("  5. Iterate based on testing results");

console.log("\n" + "=".repeat(60));
console.log(`✨ Verification completed at ${new Date().toLocaleString()}`);
console.log("=".repeat(60));

// Exit with appropriate code
process.exit(overallPercentage >= 80 ? 0 : 1);
