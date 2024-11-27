const { resolve } = require('@parcel/plugin');

module.exports = resolve({
  canResolve({ dependency }) {
    return dependency.request === '@ledgerhq/devices/hid-framing';
  },
  resolve({ dependency, options, platform }) {
    return {
      path: require.resolve('@ledgerhq/devices/hid-framing', { paths: [options.projectRoot] }),
      code: `
        export * from '@ledgerhq/devices/hid-framing';
      `,
    };
  },
});
