module.exports = {
    globals: {
        'ts-jest': {
            tsconfig: './projects/lib/tsconfig.spec.json',
            stringifyContentPathRegex: '\\.html$',
            diagnostics: {
                ignoreCodes: [151001]
            }
        }
    },
    setupFilesAfterEnv: [
        '<rootDir>/node_modules/@angular-builders/jest/dist/jest-config/setup.js'
    ],
    transform: {
        '^.+\\.(ts|js|html)$': 'ts-jest'
    },
    testMatch: [
        '**/+(*.)+(spec|test).+(ts|js)?(x)'
    ],
    transformIgnorePatterns: ['node_modules/(?!@ngrx)'],
    collectCoverageFrom: [
        'projects/lib/**/*.ts',
        '!projects/lib/**/*.module.ts',
        '!projects/lib/src/*.ts'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/assets/',
        '/dist/',
        'projects/demo-app/',
        'projects/lib/src/*.{js}'
    ],
};
