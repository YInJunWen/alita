// ref:
// - https://umijs.org/plugins/api
import type { AlitaApi } from '@alita/types';
import { chalk, crossSpawn, logger, yParser } from '@umijs/utils';
import * as child_process from 'child_process';
import { embeddedPlugins } from './plugins';

type Platform = 'ios' | 'android';

interface SyncOptions {
  deployment?: boolean;
}

async function spawnSync(
  command: string,
  args: string[] = [],
  options: child_process.SpawnSyncOptions = {},
) {
  console.log(chalk.cyan('spawnSync:', command, args.join(' ')));
  return new Promise((resolve, reject) => {
    const child = crossSpawn(command, args, { stdio: 'inherit', ...options });
    child
      .on('close', (code) => {
        if (code !== 0) {
          reject({
            command: `${command} ${args.join(' ')}`,
          });
          return;
        }
        resolve(0);
      })
      .on('error', (err) => {
        console.error('error', err);
      });
  });
}

export default (api: AlitaApi) => {
  api.onStart(() => {
    logger.info('Using Native Plugin');
  });

  ['displayName', 'packageId'].forEach((key) => {
    const config: Record<string, any> = {
      schema: (joi: any) => joi.string(),
    };
    api.registerPlugins([
      {
        id: `alita-native: config-${key}`,
        key: key,
        config,
      },
    ]);
  });

  function getNpmClient() {
    // 支持 ['npm', 'pnpm', 'yarn'] 这几种 npm client，如果配置了非这三种的，统一使用 npm
    return ['npm', 'pnpm', 'yarn'].includes(api.config.npmClient)
      ? api.config.npmClient
      : 'npm';
  }

  async function installDependencies(
    dependencies: string | string[],
    { isDev = false } = {},
  ) {
    const npmClient = getNpmClient();
    if (['yarn', 'pnpm'].indexOf(npmClient) !== -1) {
      const args = ['add'];
      if (isDev) {
        args.push('-D');
      }
      if (typeof dependencies === 'string') {
        args.push(dependencies);
      } else if (Array.isArray(dependencies)) {
        args.push(...dependencies);
      }
      await spawnSync(npmClient, args);
    } else if ('npm' === npmClient) {
      const args = ['install'];
      if (isDev) {
        args.push('--save-dev');
      }
      if (typeof dependencies === 'string') {
        args.push(dependencies);
      } else if (Array.isArray(dependencies)) {
        args.push(...dependencies);
      }
      await spawnSync(npmClient, args);
    } else {
      console.error(chalk.red(`Unknown npm client: ${npmClient}`));
      process.exit(1);
    }
  }
  /**
   * Initialize Capacitor configuration by providing an app name, app ID, and an optional web directory for the existing web app
   */
  async function initNative(
    params: {
      appName?: string;
      appID?: string;
      webDir?: string;
      all?: boolean;
    } = {},
  ) {
    console.log(chalk.cyan('native init ...'));
    await installDependencies('@capacitor/core');
    await installDependencies('@capacitor/cli', { isDev: true });
    const args = ['cap', 'init'];
    const { appName, appID, webDir, all } = params;
    if (appName) {
      args.push(appName);
    }
    if (appID) {
      args.push(appID);
    }
    args.push('--web-dir', webDir || api.config.outputPath || 'dist');
    await spawnSync('npx', args);
    if (all) {
      await addPlatform('ios');
      await addPlatform('android');
      await installDependencies(embeddedPlugins);
      await updatePlugins();
    }
  }
  /**
   * Add a native platform project to your app
   * @param platform
   */
  async function addPlatform(platform: Platform) {
    console.log(chalk.cyan(`add platform ${platform} ...`));
    await installDependencies(`@capacitor/${platform}`);
    try {
      await spawnSync('npx', ['cap', 'add', platform]);
    } catch (error) {
      // cocoapods 需要先安装，如果错误的话，给一点提示
      console.log('如果是在 Max M1 请不要使用 gem 安装 cocoapods');
      console.warn(
        'sudo gem install cocoapods，这是错误安装方式，会导致后续命令错误',
      );
      console.info('brew install cocoapods ，这是正确安装方式');
    }
  }
  /**
   * Copy the web app build and Capacitor configuration file into the native platform project. Run this each time you make changes to your web app or change a configuration value
   * @param params
   * @param params.platform android, ios
   */
  async function copyAssets({ platform }: { platform: Platform }) {
    console.log(
      chalk.cyan(`copy assets to ${platform ?? 'ios and android'} ...`),
    );
    const params = ['cap', 'copy'];
    if (platform) {
      params.push(platform);
    }
    await spawnSync('npx', params);
  }

  /**
   * Updates the native plugins and dependencies referenced in package.json
   * @param params
   * @param params.deployment Podfile.lock won’t be deleted and pod install will use --deployment option
   * @param params.platform android, ios
   */
  async function updatePlugins(
    params: {
      deployment?: boolean;
      platform?: Platform;
    } = {},
  ) {
    const { deployment, platform } = params;
    console.log(chalk.cyan('update plugins ...'));
    const options = ['cap', 'update'];
    if (deployment) {
      options.push('--deployment');
    }
    if (platform) {
      options.push(platform);
    }
    await spawnSync('npx', options);
  }
  /**
   * This command runs copy and then update
   * @param params
   */
  async function syncProject({
    options = {},
    platform,
  }: {
    options?: SyncOptions;
    platform?: Platform;
  }) {
    console.log(chalk.cyan('sync project ...'));
    const params = ['cap', 'sync'];
    if (options.deployment) {
      params.push('--deployment');
    }
    if (platform) {
      params.push(platform);
    }
    await spawnSync('npx', params);
  }
  /**
   * List all installed Cordova and Capacitor plugins.
   * @param params
   * @param params.platform android, ios
   */
  async function listPlugins(params: { platform: Platform }) {
    console.log(chalk.cyan('list plugins ...'));
    const options = ['cap', 'ls'];
    if (params.platform) {
      options.push(params.platform);
    }
    await spawnSync('npx', options);
  }
  /**
   * Opens the native project workspace in the specified native IDE (Xcode for iOS, Android Studio for Android)
   * @param params
   * @param params.platform android, ios
   */
  async function openProject(params: { platform: Platform }) {
    console.log(chalk.cyan('open project ...'));
    const options = ['cap', 'open'];
    if (params.platform) {
      options.push(params.platform);
    }
    await spawnSync('npx', options);
  }
  /**
   * This command first runs sync, then it builds and deploys the native app to a target device of your choice
   * @param params
   * @param params.options
   * @param params.options.list Print a list of target devices available to the given platform
   * @param params.options.target The target device to deploy to
   * @param params.platform android, ios
   */
  async function runProject(params: {
    options?: { list?: boolean; target?: string };
    platform: Platform;
  }) {
    console.log(chalk.cyan('run project ...'));
    const args = ['cap', 'run'];
    if (params.options?.list) {
      args.push('--list');
    }
    if (params.options?.target) {
      args.push('--target', params.options.target);
    }
    if (params.platform) {
      args.push(params.platform);
    }
    try {
      await spawnSync('npx', args);
    } catch (error) {
      console.log(
        '如果遇到错误，可以尝试排查是否是使用了 gem 安装 cocoapods，可以使用 sudo gem uninstall cocoapods 卸载后，再使用 brew install cocoapods 安装。',
      );
    }
  }
  /**
   * Install embedded plugins
   */
  async function installPlugins() {
    const plugins = embeddedPlugins;
    await installDependencies(plugins);
  }
  const { displayName, packageId } = api.userConfig;
  if (!displayName) {
    console.error('Please configure displayName in config/config.[t|j]s file.');
    return;
  }
  if (!packageId) {
    console.error('Please configure displayName in config/config.[t|j]s file.');
    return;
  }
  api.registerCommand({
    name: 'native',
    description: 'native support',
    fn: async ({ args }: any) => {
      const subCommand = args._[0];
      switch (subCommand) {
        case 'init': {
          const _args = yParser(process.argv.slice(3), {
            boolean: ['all'],
          });
          await initNative({
            appName: (args._[1] as string) || displayName,
            appID: (args._[2] as string) || packageId,
            webDir: args.webDir as string,
            all: _args.all,
          });
          break;
        }
        case 'add': {
          const platform = args._[1] as Platform;
          await addPlatform(platform);
          break;
        }
        case 'copy': {
          await copyAssets({ platform: args._[1] as Platform });
          break;
        }
        case 'update': {
          const _args = yParser(process.argv.slice(3), {
            boolean: ['deployment'],
          });
          await updatePlugins({
            deployment: _args.deployment,
            platform: _args._[1] as Platform,
          });
          break;
        }
        case 'sync': {
          const _args = yParser(process.argv.slice(3), {
            boolean: ['deployment'],
          });
          await syncProject({
            options: { deployment: _args.deployment },
            platform: _args._[1] as Platform,
          });
          break;
        }
        case 'ls': {
          await listPlugins({ platform: args._[1] as Platform });
          break;
        }
        case 'open': {
          await openProject({ platform: args._[1] as Platform });
          break;
        }
        case 'run': {
          const _args = yParser(process.argv.slice(3), { boolean: ['list'] });
          await runProject({
            options: {
              list: _args.list,
              target: _args.target as string,
            },
            platform: _args._[1] as Platform,
          });
          break;
        }
        case 'plugins': {
          await installPlugins();
          break;
        }
      }
    },
  });
};
