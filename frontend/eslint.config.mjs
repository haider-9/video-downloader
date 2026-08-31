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
    // Animate UI is a copy-paste component library whose source intentionally
    // uses patterns the default Next.js react-hooks rules reject. These files
    // are vendored as-is and are not written by us, so skip those rules here.
    files: [
      "components/animate-ui/**/*.{ts,tsx}",
      "hooks/use-is-in-view.{ts,tsx}",
      "lib/get-strict-context.{ts,tsx}",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/static-components": "off",
    },
  },
]);

export default eslintConfig;
