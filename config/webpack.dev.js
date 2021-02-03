const webpack = require('webpack');
const { merge } = require('webpack-merge');
const paths = require('./paths');
const common = require('./webpack.common.js');
const path = require('path')
const express = require('express');

module.exports = merge(common, {
    // Set the mode to development or production
    mode: 'development',

    // Control how source maps are generated
    devtool: 'inline-source-map',

    // Spin up a server for quick development
    devServer: {
        historyApiFallback: true,
        contentBase: paths.build,
        open: true,
        compress: true,
        hot: true,
        port: 8000,
        before(app) {
            app.use(express.static(path.resolve(__dirname, '../public/tonejs-instruments/samples')));
            // app.get('/tonejs-instruments/samples/piano/C7.ogg', function(req, res) {
            //     const url = path.resolve(__dirname, '../tonejs-instruments/samples/piano/C7.ogg');
            //     res.sendFile(url);
            // });
        }
    },

    plugins: [
        // Only update what has changed on hot reload
        new webpack.HotModuleReplacementPlugin(),
    ],
});