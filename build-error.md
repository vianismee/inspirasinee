Creating an optimized production build ...

> [PWA] Compile server
> [PWA] Compile server
> [PWA] Compile client (static)
> [PWA] Auto register service worker with: C:\Users\admpr\OneDrive\Documents\V\!WEBSITE\REACT JS\inspirasinee\node_modules\next-pwa\register.js
> [PWA] Service worker: C:\Users\admpr\OneDrive\Documents\V\!WEBSITE\REACT JS\inspirasinee\public\sw.js
> [PWA] url: /sw.js
> [PWA] scope: /

> Build error occurred
> Error [ValidationError]: Invalid configuration object. Webpack has been initialized using a configuration object that does not match the API schema.

- configuration.cache.cacheDirectory: The provided value "C:\\Users\\admpr\\OneDrive\\Documents\\V\\!WEBSITE\\REACT JS\\inspirasinee\\.next\\cache\\webpack" contains exclamation mark (!) which is not allowed because it's reserved for loader syntax.
  -> Base directory for the cache (defaults to node_modules/.cache/webpack).
- configuration.context: The provided value "C:\\Users\\admpr\\OneDrive\\Documents\\V\\!WEBSITE\\REACT JS\\inspirasinee" contains exclamation mark (!) which is not allowed because it's reserved for loader syntax.
  -> The base directory (absolute path!) for resolving the `entry` option. If `output.pathinfo` is set, the included pathinfo is shortened to this directory.
- configuration.module.rules[13].oneOf[12].issuer.and[0]: The provided value "C:\\Users\\admpr\\OneDrive\\Documents\\V\\!WEBSITE\\REACT JS\\inspirasinee" contains exclamation mark (!) which is not allowed because it's reserved for loader syntax.
- configuration.output.path: The provided value "C:\\Users\\admpr\\OneDrive\\Documents\\V\\!WEBSITE\\REACT JS\\inspirasinee\\.next\\server\\chunks" contains exclamation mark (!) which is not allowed because it's reserved for loader syntax.
  -> The output directory as **absolute path** (required).
  at new Promise (<anonymous>) {
  errors: [Array],
  schema: [Object],
  headerName: 'Webpack',
  baseDataPath: 'configuration',
  postFormatter: [Function: postFormatter]
  }
