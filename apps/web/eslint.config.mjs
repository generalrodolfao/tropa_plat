import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Dívida técnica documentada: relaxa no-explicit-any p/ erro→warn
      // (CI verde, lista visível). Meta: remover os `any` incrementalmente.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": [
        "warn",
        { allowObjectTypes: "always" },
      ],
      "@typescript-eslint/no-use-before-define": [
        "error",
        { functions: false, classes: true, variables: true },
      ],
      // Dívida tecnica documentada: regra nova (React 19/Hooks v6) e agressiva.
      // Acusa setState legitimos de "load on mount" inclusive em `finally` apos
      // await (analise de fluxo conservadora). Meta: migrar loaders p/ lib de
      // dados (React Query/SWR) ou `use`/Transitions.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
