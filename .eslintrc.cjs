module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:require-extensions/recommended",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "require-extensions"],
    root: true,
    rules: {
        "brace-style": ["error", "1tbs"],
        curly: ["error", "all"],
        indent: ["error", 4, { SwitchCase: 1 }],
        "prefer-const": "error",
        semi: "error",
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-array-constructor": "off",
    },
};
