const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const fs = require('fs');
const { exec } = require('child_process');

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
};

const configs = {
  umd: {
    ...baseConfig,
    ...{
      bundle: true,
      entryPoints: ['./src/index.ts'],
      outfile: 'dist/umd/index.js',
      globalName: 'L.Routing'
    }
  },
  esm: {
    ...baseConfig,
    ...{
      format: 'esm',
      outdir: 'dist/esm',
      plugins: [nodeExternalsPlugin()]
    }
  },
  cjs: {
    ...baseConfig,
    ...{
      format: 'cjs',
      outdir: 'dist/cjs',
      plugins: [nodeExternalsPlugin()]
    }
  },
};

exec('tsc', (error) => {
  if (error) {
    console.log(error.message);
    console.log(error.stack);
    console.log('Error code: '+error.code);
    console.log('Signal received: '+error.signal);
  }
});

for (const config of Object.values(configs)) {
  esbuild.build(config).catch(() => process.exit(1));
}