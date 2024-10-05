const webpack = require('webpack');

module.exports = function override(config) {
    config.resolve.fallback = {
        ...config.resolve.fallback,
        https: require.resolve('https-browserify'),
        http: require.resolve('stream-http'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        vm: require.resolve('vm-browserify'),
        process: require.resolve('process/browser'),  // Polyfill for process
    };

    // Add the plugin to provide the process global variable
    config.plugins.push(
        new webpack.ProvidePlugin({
            process: 'process/browser',  // Ensure process is available
        })
    );

    return config;
};

