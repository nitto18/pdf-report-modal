"use strict";

const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    return {
        entry: "./src/js/index.js",
        output: {
            path: path.resolve(__dirname, "./dist/js"),
            filename: argv.mode === "production" ? "pdf-report-modal.min.js" : "pdf-report-modal.js",
            libraryTarget: "umd",
            globalObject: "this",
            assetModuleFilename: "../assets/[hash][ext][query]"
        },
        optimization: {
            minimize: true,
            minimizer: [new TerserPlugin()]
        },
        module: {
            rules: [
                {
                    test: /\.(scss)$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        "sass-loader",
                    ],
                },
                {
                    test: /\.(png|svg|jpg)$/i,
                    type: "asset/resource",
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/, 
                    use: {
                        loader: "babel-loader", 
                        options: {
                            presets: ["@babel/preset-env"]
                        }
                    }
                }
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: "../css/pdf-report-modal.min.css",
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: "node_modules/pdfjs-dist/build/pdf.worker.min.js",
                        to: "../js"
                    }
                ]
            })
        ]
    };
} 