const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, './dist/index.cjs');

require('esbuild').build({
  entryPoints: ['./src/index.mjs'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: ['node22'],
  outfile: './dist/index.cjs',
  inject: ['./meta-shim.js'],
  define: { 'import.meta.url': 'import_meta_url' },
}).then(() => {
  const file = fs.readFileSync(filePath, 'utf8');
  const modifiedData = file.replace('import_node_path.default.join(__dirname, "vendor", binary);', 'import_node_path.default.join("rpc", binary);');
  fs.writeFileSync(filePath, modifiedData, 'utf8');
  console.log('ESbuild completed successfully.');
});