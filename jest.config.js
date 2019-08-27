module.exports = {
    globals: {
        'ts-jest': {
            tsConfig: './tsconfig.spec.json',
            stringifyContentPathRegex: '\\.html$',
            astTransformers: [
                require.resolve('jest-preset-angular/InlineHtmlStripStylesTransformer')
            ]
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
    testEnvironment: 'jest-environment-jsdom-thirteen',
    moduleNameMapper: {
        '^lodash-es$': '<rootDir>/node_modules/lodash/index.js'
        // '@core/(.*)': '<rootDir>/src/app/core/$1',
        // '@shared/(.*)': '<rootDir>/src/app/shared/$1'
    },
    transformIgnorePatterns: ['node_modules/(?!@ngrx)'],
    collectCoverageFrom: [
        'src/app/**/*.ts',
        '!src/app/**/*.module.ts',
        '!src/app/**/*.array.ts',
        '!src/app/fragmentTypes.ts'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', 'src/app/*.{js}'],
    snapshotSerializers: [
        'jest-preset-angular/AngularSnapshotSerializer.js',
        'jest-preset-angular/HTMLCommentSerializer.js'
    ]
};
