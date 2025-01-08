import type { AlitaApi } from '@alita/types';
import { logger } from '@umijs/utils';

export default (api: AlitaApi) => {
  api.onStart(() => {
    logger.event('alita plugins dev presets');
  });
  return {
    plugins: [
      require.resolve('./aconsole'),
      require.resolve('./antdmobile'),
      require.resolve('./hd'),
      require.resolve('./keepalive'),
      require.resolve('./mainpath'),
      require.resolve('./request'),
      require.resolve('./mobile-layout'),
      require.resolve('./dva'),
      // require.resolve('@umijs/plugins/dist/dva'),
      require.resolve('@umijs/plugins/dist/model'),
    ],
  };
};
