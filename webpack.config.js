const path = require('path')
const webpack = require('webpack')
const ExtractText = require('extract-text-webpack-plugin')
const ImageminPlugin = require('imagemin-webpack-plugin').default
const isProduction = (
    "build" === process.env.npm_lifecycle_event ||
    "production" === process.env.NODE_ENV
)

const devtool = isProduction ? 'source-map' : '#eval-source-map'
const config = module.exports = {
    devtool,
    entry: {
        app: ["./app/client.jsx"]
    },
    output: {
        path: path.resolve("./static"),
        publicPath: "/",
        filename: "[name].bundle.js",
        chunkFilename: "[id].chunk.js",
        devtoolModuleFilenameTemplate: "/[absolute-resource-path]"
    },
    resolve: {
        alias: {
            "app": path.resolve("./app"),
            "styled-components$": "styled-components/lib/index.js"
        },
        extensions: [".js", ".jsx", ".json"]
    },
    devServer: {
        stats: "errors-only",
        publicPath: "/",
        noInfo: true,
        inline: true,
        hot: true,
        historyApiFallback: true
    },
    node: {
        global: true,
        net: "mock",
        dns: "mock"
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: "babel-loader",
                exclude: /(node_modules|\/vendor\.js$)/
            },
            {
                test: /\.json$/,
                loader: "json-loader"
            },
            {
                test: /\.(graphql|gql)$/,
                exclude: /node_modules/,
                loader: 'graphql-tag/loader'
            },
            {
                test: /\.css$/,
                loader: ExtractText.extract({
                    fallbackLoader: 'style-loader?-singleton&insertAt=top',
                    loader: 'css-loader?-mimize&-autorepfixer&-sourceMap'
                })
            },
            {
                test: /\.(jpe?g|webp|bmp|ico|png|svg|woff2?|ttf|eot)/,
                loader: "url-loader",
                options: {
                    limit: 1024000
                }
            }
        ]
    },
    plugins: [
        new ExtractText({
            allChunks: true,
            disable: !isProduction, // !isProduction,
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
                "NODE_ENV": JSON.stringify(isProduction ? 'production' : 'development')
            }
        })
    ]
}

const babiliPreset = {

}
if (isProduction) {
    const BabiliPlugin = require('babili-webpack-plugin')
    config.plugins.push(
        new webpack.optimize.AggressiveMergingPlugin(),
        new BabiliPlugin({test: /\.jsx?/}),
        new ImageminPlugin()
    )
} else {
    config.plugins.unshift(
        new webpack.NoErrorsPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    )
    config.entry["app"].unshift(
        "react-hot-loader/patch",
        "webpack-hot-middleware/client?overlay=true&reload=false"
    )
}
