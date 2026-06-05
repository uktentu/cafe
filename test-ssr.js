global.self = new Proxy({}, {
  get: function(target, prop) {
    console.log("ACCESSED SELF.", prop);
    if (prop === 'webpackChunk_N_E') return undefined;
    return undefined;
  }
});
try {
  require('./.next/server/app/(cms)/cms/(app)/items/page.js');
} catch (e) {
  console.error(e);
}
