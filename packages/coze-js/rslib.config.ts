import { defineConfig } from '@rslib/core';
import getRslibConfig from '@coze-infra/rslib-config';
export default defineConfig(
  getRslibConfig({
    format: ['esm', 'cjs', 'umd'],
    bundle: 'excludeExternal',
    umdName: 'CozeJs',
  }),
);
