module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/dashboard/projects',
        'http://localhost:3000/dashboard/work-entries',
        'http://localhost:3000/dashboard/teams',
        'http://localhost:3000/dashboard/materials',
        'http://localhost:3000/dashboard/geospatial',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        // Performance budgets (according to our migration plan targets)
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.8 }],

        // Core Web Vitals (our migration targets)
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }], // Target: <1.5s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // Target: <2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // Target: <0.1
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // Target: <200ms
        'speed-index': ['error', { maxNumericValue: 3000 }], // Target: <3s

        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 100000 }], // 100KB
        'unused-css-rules': ['warn', { maxNumericValue: 50000 }], // 50KB
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'uses-text-compression': 'error',
        'uses-responsive-images': 'error',
        'modern-image-formats': 'warn',

        // Network optimization
        'server-response-time': ['error', { maxNumericValue: 500 }], // <500ms TTFB
        'uses-http2': 'error',
        'uses-long-cache-ttl': 'warn',
        'efficient-animated-content': 'warn',

        // Bundle size (according to our targets)
        'total-byte-weight': ['error', { maxNumericValue: 2000000 }], // 2MB total
        'dom-size': ['warn', { maxNumericValue: 1500 }], // DOM elements

        // User experience
        'interactive': ['error', { maxNumericValue: 3000 }], // TTI <3s
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 2000 }],

        // Progressive Web App
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        'content-width': 'error',
        'viewport': 'error',

        // Security
        'is-on-https': 'error',
        'uses-https': 'error',
        'csp-xss': 'warn',

        // Best practices
        'errors-in-console': 'warn',
        'image-aspect-ratio': 'warn',
        'image-size-responsive': 'warn',
        'preload-fonts': 'warn',
        'valid-source-maps': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lighthouse-ci.db',
      },
    },
  },
};