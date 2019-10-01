module.exports = {
    globals: {
        'ts-jest': {
            tsConfig: './projects/lib/tsconfig.spec.json',
            stringifyContentPathRegex: '\\.html$',
            astTransformers: [
                require.resolve('jest-preset-angular/InlineHtmlStripStylesTransformer')
            ],
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
    testEnvironment: 'jest-environment-jsdom-thirteen',
    moduleNameMapper: {
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
    testPathIgnorePatterns: [
        '/node_modules/',
        '/assets/',
        '/dist/',
        'projects/demo-app/',
        'projects/lib/src/*.{js}'
    ],
    snapshotSerializers: [
        'jest-preset-angular/AngularSnapshotSerializer.js',
        'jest-preset-angular/HTMLCommentSerializer.js'
    ]
};
