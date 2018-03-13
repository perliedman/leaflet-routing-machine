import json from 'rollup-plugin-json'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import sizes from "rollup-plugin-sizes"

export default {
  input: 'src/main.js',
  external: ['leaflet'],
  output: {
    file: 'dist/leaflet-routing-machine.js',
    format: 'umd',
    name: 'lrm',
    globals: {
      'leaflet': 'L'
    }
  },
  plugins: [
    json({ preferConst: true }),
    svelte({
      css: function (css) {
        css.write('dist/leaflet-routing-machine.css')
      }
    }),
    resolve({browser: true}),
    commonjs(),
    sizes()
  ]
}
