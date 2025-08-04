import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import { createHtmlPlugin } from 'vite-plugin-html'
// Vant 按需引入 的插件
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

export default ({ mode }) => {
    const envDir = 'env'
    const envPrefix = 'E_'
    const outDir = `dist/${mode}`
    const { E_API_PREFIX, E_API_BASE_URL } = loadEnv(mode, resolve(process.cwd(), envDir), envPrefix)

    const proxy = {}
    proxy[E_API_PREFIX] = {
        target: E_API_BASE_URL,
        changeOrigin: true,
        rewrite: path => path.replace(new RegExp(`^${E_API_PREFIX}`), ''),
    }

    return defineConfig({
        plugins: [
            vue(),
            vueJsx(),
            AutoImport({ imports: ['vue', 'vue-router', 'pinia'] }),
            Components({ resolvers: [VantResolver()], directoryAsNamespace: true }),
            createHtmlPlugin({
                inject: {
                    data: { HTML_TITLE: setWebsiteTitle(mode) },
                },
            }),
        ],
        resolve: { alias: { '@': resolve(__dirname, 'src') } },
        css: {
            preprocessorOptions: {
                scss: { additionalData: "@import '@/assets/scss/index.scss';" },
            },
        },
        envDir,
        envPrefix,
        // 打包配置
        build: {
            outDir,
            rollupOptions: { output: { manualChunks } },
        },
        // server: { host: '0.0.0.0', port: 1612, proxy },
        server: { host: '0.0.0.0', port: 1612},
    })
}

// 网站标题 配置
const setWebsiteTitle = mode => (mode != 'pro' ? `| ${mode.toUpperCase()}` : null)

// Rollup 配置
const manualChunks = id => {
    // const chunkXG1 = '/node_modules/xgplayer'
    // if (id.includes(chunkXG1)) return 'xgplayer'
    // const chunkXG2 = '/node_modules/crypto-es'
    // if (id.includes(chunkXG2)) return 'xgplayer'
    // const chunkXG3 = '/node_modules/danmu.js'
    // if (id.includes(chunkXG3)) return 'xgplayer'

    const chunkVUE = '/node_modules/vue'
    if (id.includes(chunkVUE)) return 'vue'

    const chunk1 = '/node_modules/'
    if (id.includes(chunk1)) return id.split(chunk1)[1].split('/')[0]

    const chunk2 = '/src/assets/images/avatar/'
    if (id.includes(chunk2)) return 'avatar'

    // const chunk3 = '/src/components/Y/'
    // if (id.includes(chunk3)) return 'Y-Component'
}
