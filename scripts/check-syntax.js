// Simple script to check syntax of a TypeScript file
const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];
if (!filePath) {
  console.error("Please provide a file path to check");
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), filePath);
console.log(`Checking syntax of ${fullPath}`);

try {
  // Just attempt to read the file
  const content = fs.readFileSync(fullPath, "utf8");

  // Basic JS syntax validation
  try {
    // Use Function constructor as a simple syntax validator
    new Function(content);
    console.log("✅ Basic syntax check passed");
  } catch (syntaxError) {
    console.error("❌ Syntax error found:");
    console.error(syntaxError);
    process.exit(1);
  }
} catch (readError) {
  console.error(`Error reading file: ${readError.message}`);
  process.exit(1);
}
