const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const fs = require('fs');

const tsFiles = [];

function traverseSourceFiles(directory = './src') {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const relativePath = `${directory}/${file}`;
    const path = fs.lstatSync(relativePath);
    if (path.isDirectory()) {
      traverseSourceFiles(relativePath);
    } else if (path.isFile() && file.endsWith('.ts')) {
      tsFiles.push(relativePath);
    } else {
      console.debug(`File ${relativePath} could not be compiled`);
    }
  }
}

traverseSourceFiles();

console.log(`Found ${tsFiles.length} files to compile`);

const baseConfig = {
  entryPoints: tsFiles,
  bundle: true,
};

const configs = {
  umd: {
    ...baseConfig,
    ...{
      entryPoints: ['./src/index.ts'],
      outfile: 'build/umd/index.js',
    }
  },
  esm: {
    ...baseConfig,
    ...{
      format: 'esm',
      outdir: 'build/esm',
      plugins: [nodeExternalsPlugin()]
    }
  },
  esm: {
    ...baseConfig,
    ...{
      format: 'cjs',
      outdir: 'build/cjs',
      plugins: [nodeExternalsPlugin()]
    }
  },
};

for (const config of Object.values(configs)) {
  esbuild.build(config).catch(() => process.exit(1));
}
