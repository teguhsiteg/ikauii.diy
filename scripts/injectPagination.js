/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const excludeFiles = [
  'app/masterclass/[id]/certificate/page.tsx',
  'app/(dashboard)/dashboard/superadmin/templates/page.tsx',
  'app/(dashboard)/dashboard/proker/[slug]/cetak/[id]/CetakClient.tsx',
  'app/(dashboard)/dashboard/e-office/print/[id]/page.tsx',
  'app/(dashboard)/dashboard/verifikasi-anggota/page.tsx',
  'app/(dashboard)/dashboard/master-data/components/TabAnggotaSah.tsx',
  'app/(dashboard)/dashboard/master-data/components/TabPengurus.tsx',
  'app/(dashboard)/dashboard/master-data/components/TabAnggota.tsx',
];

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if(file !== 'node_modules' && file !== '.next' && file !== '.git') {
         arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if(file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('./app');

let modifiedCount = 0;

for (const file of files) {
  const normFile = file.replace(/\\/g, '/');
  if (excludeFiles.some(ex => normFile.includes(ex))) {
    continue; // Skip excluded files
  }

  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('<table')) continue; // No table
  if (content.includes('PaginationProps') || content.includes('Pagination from "@/components')) continue; // Already paginated

  console.log('Processing:', normFile);

  // 1. Find the mapped array name
  const tbodyMatch = content.match(/<tbody[^>]*>[\s\S]*?([a-zA-Z0-9_]+)\.map/);
  if (!tbodyMatch) {
    console.log('  -> Could not find mapped array in tbody for', normFile);
    continue;
  }
  const arrayName = tbodyMatch[1];
  console.log('  -> Found array:', arrayName);

  // 2. Add imports
  if (!content.includes('import Pagination')) {
     const importStatement = `import Pagination from "@/components/ui/Pagination";\n`;
     // insert after last import
     const lastImportIndex = content.lastIndexOf('import ');
     if (lastImportIndex !== -1) {
       const endOfLastImport = content.indexOf('\n', lastImportIndex);
       content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
     } else {
       content = importStatement + content;
     }
  }

  // 3. Add state inside the component
  // Find component start: export default function X() {
  const compMatch = content.match(/export default function [A-Za-z0-9_]+\s*\([^)]*\)\s*{/);
  if (compMatch) {
    const compStartIdx = compMatch.index + compMatch[0].length;
    
    // Check if useState exists, else we might have to add it, but usually it exists.
    const stateHook = `
  const [itemsPerPage, setItemsPerPage] = useState<number | string>(10);
  const [currentPage, setCurrentPage] = useState(1);
`;
    // Find a good place to insert (after component declaration)
    content = content.slice(0, compStartIdx) + stateHook + content.slice(compStartIdx);
  } else {
     console.log('  -> Component start not found');
     continue;
  }

  // 4. Add paginatedData useMemo
  // Insert before `return (`
  const returnMatch = content.lastIndexOf('\n  return (');
  if (returnMatch !== -1) {
     const useMemoLogic = `
  const paginatedData = React.useMemo(() => {
    if (itemsPerPage === "Semua") return ${arrayName};
    const startIndex = (currentPage - 1) * (itemsPerPage as number);
    return ${arrayName}.slice(startIndex, startIndex + (itemsPerPage as number));
  }, [${arrayName}, currentPage, itemsPerPage]);
`;
     content = content.slice(0, returnMatch) + useMemoLogic + content.slice(returnMatch);
  }

  // 5. Replace mapped array with paginatedData
  const regex = new RegExp(`\\b${arrayName}\\.map`, 'g');
  content = content.replace(regex, `paginatedData.map`);

  // 6. Insert Pagination UI after table
  const tableEndRegex = /<\/table>\s*(?:<\/div>)?/g;
  let match;
  let lastMatchIndex = -1;
  while ((match = tableEndRegex.exec(content)) !== null) {
      lastMatchIndex = match.index + match[0].length;
  }
  
  if (lastMatchIndex !== -1) {
    const paginationUI = `
        <Pagination
          totalItems={${arrayName}.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
`;
    content = content.slice(0, lastMatchIndex) + paginationUI + content.slice(lastMatchIndex);
  }

  fs.writeFileSync(file, content, 'utf8');
  modifiedCount++;
  console.log('  -> Updated successfully!');
}

console.log('Total files paginated:', modifiedCount);
