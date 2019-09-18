module.exports = function (wallaby) {
    return {
        files: [
            'src/**/*.[j,t]s',
        ],
        tests: [
            'tests/**/*.test.ts',
        ],
        env: {
            type: 'node',
            runner: 'node'
        },
        testFramework: 'mocha',
        debug: true,
        // workers: {
        //     initial: 1,
        //     regular: 1,
        //     // restart: true,
        // },
    };
};
