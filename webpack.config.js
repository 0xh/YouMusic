const path = require("path")
const webpack = require("webpack")
const ExtractText = require("extract-text-webpack-plugin")
const {
    CheckerPlugin,
    TsConfigPathsPlugin
} = require("awesome-typescript-loader")

const isProduction = !!(
    "build" === process.env.npm_lifecycle_event ||
    "production" === process.env.NODE_ENV
)

const tryCatch = (t, c) => {
    try {
        return t()
    } catch (err) {
        return c(err)
    }
}

const config = module.exports = {
    devtool: isProduction ? "source-map" : "cheap-module-inline-source-map",
    performance: { hints: false },
    entry: {
        app: ["./app/client.tsx"]
    },
    output: {
        path: path.resolve("./static/assets"),
        publicPath: "/assets/",
        filename: "[name].bundle.js",
        chunkFilename: "[id].chunk.js"
        // devtoolModuleFilenameTemplate: "/[resourcePath]"
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        alias: {
            "app": path.resolve("./app"),
            "styled-components$": "styled-components/lib/index.js"
        }
    },
    devServer: {
        stats: "errors-only",
        publicPath: "/assets/",
        noInfo: true,
        inline: true,
        hot: true,
        historyApiFallback: true
    },
    node: {
        global: true,
        net: "mock",
        dns: "mock"
        // child_process: "mock"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                include: path.join(__dirname, "app"),
                exclude: /(node_modules|\/vendor\.js$)/,
                options: {
                    configFileName: "tsconfig.webpack.json",
                    configFilename: "tsconfig.webpack.json"
                }
            },
            {
                test: /\.(graphql|gql)$/,
                exclude: /node_modules/,
                loader: "graphql-tag/loader"
            },
            {
                test: /\.css$/,
                loader: ExtractText.extract({
                    fallbackLoader: "style-loader?-singleton&insertAt=top",
                    loader: "css-loader?mimize&autorepfixer&sourceMap"
                })
            },
            {
                test: /\.(jpe?g|webp|bmp|ico|png|svg|woff2?|ttf|eot)/,
                loader: "url-loader",
                options: {
                    limit: 10240
                }
            }
        ]
    },
    plugins: [
        new webpack.DllReferencePlugin({
            contenxt: '.',
            manifest: tryCatch(
                () => require('./static/assets/vendor.manifest.json'),
                () => ({ name: "vendor_dll", content: {} }))
        }),
        // new webpack.IgnorePlugin(/^\.\/locale-data$/, /react-intl$/),
        new CheckerPlugin(),
        new TsConfigPathsPlugin({
            tsconfig: "tsconfig.webpack.json",
            configFilename: "tsconfig.webpack.json",
            configFileName: "tsconfig.webpack.json",
            compiler: "typescript"
        }),
        new ExtractText({
            allChunks: true,
            disable: !isProduction,
            filename: "styles.bundle.css"
        }),
        new webpack.ProvidePlugin({
            "Promise": "bluebird"
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: isProduction
        }),
        new webpack.DefinePlugin({
            DEV: !isProduction,
            __DEV__: !isProduction,
            "typeof window": JSON.stringify("object"),
            "process.env": {
                "NODE_ENV": JSON.stringify(process.env.NODE_ENV)
            }
        })
    ]
}

if (isProduction) {
    const OptimizeJsPlugin = require("optimize-js-plugin")
    const CompressionPlugin = require("compression-webpack-plugin")
    const ImageminPlugin = require("imagemin-webpack-plugin").default
    const BabiliPlugin = require("babili-webpack-plugin")
    const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")

    // config.entry["vendor"] = "./app/vendor.js"
    config.plugins.push(
        // new webpack.optimize.CommonsChunkPlugin({
        //     name: "vendor"
        // }),
        new BundleAnalyzerPlugin({
            openAnalyzer: false,
            analyzerMode: "static",
            generateStatsFile: true,
            statsOptions: {
                assets: true,
                source: false,
                modules: false,
                chunks: false,
                chunkModules: false
            }
        }),
        new webpack.optimize.AggressiveMergingPlugin(),
        new ImageminPlugin(),
        new OptimizeJsPlugin(),
        new CompressionPlugin(),
        new BabiliPlugin()
    )
} else {
    config.plugins.unshift(
        // new webpack.NoEmitOnErrorsPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    )
    config.entry["app"].unshift(
        "react-hot-loader/patch",
        "webpack-hot-middleware/client?overlay=true&reload=false&quiet=true"
    )
}
