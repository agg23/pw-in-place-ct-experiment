import type { IncomingMessage } from 'http';
import type { Plugin } from 'vite';

// TODO: Remove duplication with Webpack
export const VIRTUAL_ENTRYPOINT_NAME = '_pw-ct-entrypoint';
export const VIRTUAL_ENTRYPOINT_PATH = `virtual:${VIRTUAL_ENTRYPOINT_NAME}`;

const indexHTML = `
<!doctype html>
<html lang="en">
  <body>
    <div id="ct-root"></div>
    <script type="module">
      import entrypoint from '/@id/${VIRTUAL_ENTRYPOINT_PATH}';
      window.__PW_ENTRYPOINT = entrypoint;
    </script>
  </body>
</html>
`;

let virtualEntrypoint = "export default function entrypoint() { throw new Error('Failed to set up virtual module'); }";

export const pwPlugin = (): Plugin => {
  return {
    name: 'pw-ct-vite-plugin',
    config: (config) => {
      config.server = config.server || {};
      config.server.port = 3100;
      config.server.hmr = false;
      return config;
    },
    configureServer: async (server) => {
      server.middlewares.use(async (req, res, next) => {
        // Intercept index.html requests rather than using transformIndexHtml, as it isn't called 
        // if it can't find index.html on the fs
        if (req.url === '/') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.end(indexHTML);

          return;
        } else if (req.url === `/${VIRTUAL_ENTRYPOINT_NAME}` && req.method === 'POST') {
          try {
            const body = await getRawBody(req);
            const jsonBody = JSON.parse(body) as { body: string };

            if (!jsonBody.body) {
              res.statusCode = 400;
              res.end();
              return;
            }

            virtualEntrypoint = jsonBody.body;

            // Update AST
            const module = server.moduleGraph.getModuleById(VIRTUAL_ENTRYPOINT_PATH);
            if (module) {
              server.moduleGraph.invalidateModule(module);
            }

            res.statusCode = 200;
            res.end();
            return;
          } catch {
            // Do nothing
          }
        }

        next();
      });
    },
    resolveId: (id) => {
      if (id === VIRTUAL_ENTRYPOINT_PATH) {
        return VIRTUAL_ENTRYPOINT_PATH;
      }
    },
    load: (id) => {
      if (id === VIRTUAL_ENTRYPOINT_PATH) {
        return virtualEntrypoint;
      }
    }
  };
};

const getRawBody = async (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      req.on('data', (chunk: Uint8Array) => {
          chunks.push(chunk);
      });

      req.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer.toString());
      });

      req.on('error', (error) => {
          reject(error);
      });
  });
}
