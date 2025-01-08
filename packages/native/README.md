# @alitajs/native

[![NPM version](https://img.shields.io/npm/v/@alita/native.svg?style=flat)](https://npmjs.org/package/@alita/native) [![NPM downloads](http://img.shields.io/npm/dm/@alita/native.svg?style=flat)](https://npmjs.org/package/@alita/native)

## Usage

Configure in `.umirc.js` 或 `config/config.ts`;

```js
export default {
  appType: 'native',
};
```

### Init native

Initialize Capacitor configuration by providing an app name, app ID, and an optional web directory for the existing web app.

Please configure displayName and packageId in config/config.[t|j]s file.

```ts
export default {
  appType: 'native',
  displayName: 'AlitaDemo', // The application's name
  packageId: 'com.example.appname', // The application's App ID;
};
```

- `appName` (required): The application's name
- `appID` (required): The application's App ID; something like `com.example.appname`

```bash
npx alita native init
```

<strong>Options:</strong>

- `--web-dir <value>`: The existing web application to use with initialization, default `dist`
- `--all`: Add ios and android platform. Add frequently used plugins.

### Add platform

Add a native platform project to your app.

```bash
npx alita native add <platform>
```

<strong>Inputs:</strong>

- `platform` (required): `android`, `ios`

### Plugins

- [Official plugins](https://github.com/ionic-team/capacitor-plugins)
- [Community plugins](https://github.com/capacitor-community)

```sh
npx alita native plugins
```

This command will install frequently used plugins.

### Live reload

Within `capacitor.config.json`, create a `server` entry then configure the `url` field using the local web server's IP address and port:

```js
"server": {
  "url": "http://192.168.1.68:8000",
  "cleartext": true
},
```

### Build web

You may need to build the web when you public app

```bash
yarn build
```

### Copy assets

Copy the web app build and Capacitor configuration file into the native platform project. Run this each time you make changes to your web app or change a configuration value.

```bash
npx alita native copy [<platform>]
```

<strong>Inputs:</strong>

- `platform` (optional): `android`, `ios`

### Update native

Updates the native plugins and dependencies referenced in `package.json`.

```bash
npx alita native update [<platform>]
```

<strong>Inputs:</strong>

- `platform` (optional): `android`, `ios`

<strong>Options:</strong>

- `--deployment`: Podfile.lock won't be deleted and pod install will use `--deployment` option.

### Sync project

This command runs `copy` and then `update`.

```bash
npx alita native sync [options] [<platform>]
```

<strong>Inputs:</strong>

- `platform` (optional): `android`, `ios`

<strong>Options:</strong>

- `--deployment`: Podfile.lock won't be deleted and pod install will use `--deployment` option.

### Run project

```bash
npx alita native run [options] <platform>
```

<strong>Inputs:</strong>

- `platform` (required): `android`, `ios`

<strong>Options:</strong>

- `--list`: Print a list of target devices available to the given platform
- `--target <id>`: Run on a specific target device

## FAQ

### 1、没有 Max 设备能不能运行 ios 项目？

可以，请自行搜索，Window 系统上如何安装双系统。

### 2、根据文档一直报错，日志中满满的 ruby 日志，这是怎么回事？

上文是建立在你有原生开发环境的基础上的，如果你当前设备没有安装任何的原生开发环境，请先配置你的电脑。
比如 Max 需要下载 Xcode （并且需要手动打开一次，需要签署一个协议），安装 `cocoapods`。

> 值得注意的是，Max M1 的话，请不要使用 `gem` 安装 `cocoapods`，如果你已经使用 `sudo gem install cocoapods` 安装过 `cocoapods` ，请使用 `sudo gem uninstall cocoapods` 卸载后，再使用 `brew install cocoapods` 安装。

### 3、我没有原生开发基础，能不能使用？

可以使用，这是面向前端开发人员的技术方案，你只需要查阅相关原生应用如何打包构建即可，网上很多教程，选最新的跟着步骤正确配置你的证书和签名文件。

### 4、原生能力是不是很难，我会用吗？

Alita @3 中使用的原生能力来着很流行的 Ionic 团队开发的 [Capacitor](https://ionicframework.com/docs/native)，它是采用插件的方式扩展原生能力的，并且提供了前端人员熟悉的 node 命令安装方式，你甚至都不需要打开原生开发 IDE 就可以完成原生能力的开发调用，（调用是重点）