// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"
import type { RollupOptions } from "rollup"
import license from "rollup-plugin-license"

const config: RollupOptions = {
    input: "src/index.ts",
    output: {
        esModule: true,
        file: "dist/index.js",
        format: "es",
        sourcemap: true,
    },
    plugins: [
        typescript(),
        nodeResolve({ preferBuiltins: true }),
        commonjs(),
        terser(),
        license({
            thirdParty: {
                includePrivate: true,
                output: "dist/licenses.txt",
            },
        }),
    ],
}

export default config
