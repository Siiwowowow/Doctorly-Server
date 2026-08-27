import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const outputFile = path.join(rootDir, "PROJECT_CODEBASE_AUDIT.md");

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  "generated",
  "coverage",
  "migrations"
]);

const IGNORED_FILES = new Set([
  ".env",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "PROJECT_CODEBASE_AUDIT.md",
  "generate_audit_dump.js",
  "Backend-PH-Healthcare-Management-System-API.postman_collection-test.json"
]);

function getTree(dir, prefix = "") {
  let output = "";
  const items = fs.readdirSync(dir, { withFileTypes: true })
    .filter(item => !IGNORED_DIRS.has(item.name) && !IGNORED_FILES.has(item.name))
    .sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const pointer = isLast ? "└── " : "├── ";
    output += `${prefix}${pointer}${item.name}${item.isDirectory() ? "/" : ""}\n`;
    if (item.isDirectory()) {
      output += getTree(path.join(dir, item.name), prefix + (isLast ? "    " : "│   "));
    }
  });
  return output;
}

function getAllFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (IGNORED_DIRS.has(item.name) || IGNORED_FILES.has(item.name)) continue;
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const tree = getTree(rootDir);
const allFiles = getAllFiles(rootDir).sort();

let content = `# Complete Project Codebase for Audit\n\n`;
content += `**Project Name:** L2B6-Backend-PH-Healthcare-Management-System\n`;
content += `**Generated Date:** ${new Date().toISOString()}\n`;
content += `**Total Source Files:** ${allFiles.length}\n\n`;
content += `> **Audit Instruction for AI:**\n`;
content += `> You are acting as a Senior Backend Architect and Security Auditor.\n`;
content += `> Please perform a comprehensive code audit of this Node.js / Express / TypeScript / Prisma backend application covering:\n`;
content += `> 1. **Security & Auth Vulnerabilities** (JWT, authentication, authorization/RBAC, inputs, cookies)\n`;
content += `> 2. **Architecture & Design Patterns** (Module structure, separation of concerns, clean code)\n`;
content += `> 3. **Database & Transactions** (Prisma queries, transaction management, race conditions, indexes)\n`;
content += `> 4. **Validation & Error Handling** (Zod validation completeness, global error handling, edge cases)\n`;
content += `> 5. **Performance & Optimization Bottlenecks**\n`;
content += `> 6. **Actionable Recommendations with Code Fixes**\n\n`;

content += `## 1. Directory Structure\n\n\`\`\`\n.\n${tree}\`\`\`\n\n`;
content += `## 2. All Project Files and Code\n\n`;

for (const filePath of allFiles) {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
  const ext = path.extname(filePath).replace(".", "") || "text";
  let lang = "text";
  if (ext === "ts") lang = "typescript";
  else if (ext === "js" || ext === "mjs") lang = "javascript";
  else if (ext === "json") lang = "json";
  else if (ext === "prisma") lang = "prisma";
  else if (ext === "md") lang = "markdown";
  else if (ext === "ejs") lang = "html";
  else if (ext === "yml" || ext === "yaml") lang = "yaml";
  
  let fileContent = "";
  try {
    fileContent = fs.readFileSync(filePath, "utf-8");
  } catch (e) {
    fileContent = `// Error reading file: ${e.message}`;
  }

  content += `### File: \`${relativePath}\`\n\n`;
  content += `\`\`\`${lang}\n// File: ${relativePath}\n\n${fileContent}\n\`\`\`\n\n---\n\n`;
}

fs.writeFileSync(outputFile, content, "utf-8");
console.log(`Audit dump generated successfully at ${outputFile} (Size: ${(content.length / 1024).toFixed(2)} KB, Files: ${allFiles.length})`);
