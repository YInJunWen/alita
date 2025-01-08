// Inspired by
// - https://github.com/google/zx
// - https://github.com/antfu/unplugin-auto-import
// - https://github.com/umijs/umi/packages/preset-umi/src/features/autoImport/autoImport.ts

import { writeFileSync } from 'fs';
import { join } from 'path';
import { IApi } from 'umi';
import babelPlugin from './babelPlugin';
import { ILib, IOpts } from './types';

const umiImportItems: string[] = [];
const reactImportItems: string[] = [];

export default (api: IApi) => {
  api.registerMethod({ name: 'addLowImportLibs' });
  api.describe({
    key: 'autoImport',
    config: {
      schema({ zod }) {
        return zod
          .object({
            libs: zod.array(zod.any()),
            css: zod.string(),
          })
          .deepPartial();
      },
    },
    enableBy: api.EnableBy.config,
  });

  api.modifyAppData(async (memo) => {
    memo.autoImport = [
      ...(await api.applyPlugins({
        key: 'addLowImportLibs',
        initialValue: [],
      })),
      ...(api.config.autoImport.libs || []),
    ];
  });

  api.onStart(() => {
    // generate dts
    const dts = api.appData.autoImport.map((lib: ILib) => {
      if (lib.withObj) {
        const memberDts = (lib.members || [])
          .map(
            (member) =>
              `${member}: typeof import('${lib.importFrom}')['${member}'],`,
          )
          .join('\n');
        return `const ${lib.withObj} : {\n${memberDts}\n};`;
      } else if (lib.namespaceImport) {
        return `const ${lib.namespaceImport}: typeof import('${lib.importFrom}');`;
      } else if (lib.defaultImport) {
        return `const ${lib.defaultImport}: typeof import('${lib.importFrom}')['default'];`;
      } else {
        return (lib.members || [])
          .map(
            (member) =>
              `const ${member}: typeof import('${lib.importFrom}')['${member}'];`,
          )
          .join('\n');
      }
    });

    const content =
      `
// generated by umi
declare global {
${dts.join('\n')}
}
export {}
    `.trim() + `\n`;
    writeFileSync(join(api.paths.cwd, 'autoImport.d.ts'), content, 'utf-8');
  });

  api.addBeforeBabelPresets(() => {
    const opts = normalizeLibs(api.appData.autoImport);
    const css = api.config.autoImport?.css || 'less';
    return [
      {
        plugins: [
          [babelPlugin, { opts, css, umiImportItems, reactImportItems }],
        ],
      },
    ];
  });
};

function normalizeLibs(libs: ILib[]): IOpts {
  const withObjs: Record<string, any> = {};
  const identifierToLib: Record<string, string> = {};
  const defaultToLib: Record<string, string> = {};
  const namespaceToLib: Record<string, string> = {};
  for (const lib of libs) {
    if (lib.withObj) {
      withObjs[lib.withObj] = lib;
    } else if (lib.namespaceImport) {
      namespaceToLib[lib.namespaceImport] = lib.importFrom;
    } else if (lib.defaultImport) {
      defaultToLib[lib.defaultImport] = lib.importFrom;
    } else {
      for (const member of lib.members || []) {
        identifierToLib[member] = lib.importFrom;
      }
    }
  }
  return {
    withObjs,
    identifierToLib,
    defaultToLib,
    namespaceToLib,
  };
}
