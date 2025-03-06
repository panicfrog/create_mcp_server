type TemplateContent = string;

const INDEX_TS_TEMPLATE: TemplateContent = `import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { z } from 'zod';

const server = new McpServer({
  name: "#{SERVER_NAME}#",
  version: "1.0.0"
});

server.tool(
  "add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }]
  })
)

const app = express();
const PORT = 3001;

let transport: SSEServerTransport | undefined = undefined;

app.get("/sse", async (_, res) => {
  const _transport = new SSEServerTransport("/messages", res);
  transport = _transport;
  await server.connect(_transport)
})

app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res)
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`server listening on port: \${PORT}\`);
});`;

const TS_CONFIG_TEMPLATE: TemplateContent = `{
  "compilerOptions": {
    /* Visit https://aka.ms/tsconfig to read more about this file */

    /* Projects */

    /* Language and Environment */
    "target": "es2021",                                  /* Set the JavaScript language version for emitted JavaScript and include compatible library declarations. */

    /* Modules */
    "module": "commonjs",                                /* Specify what module code is generated. */

    /* JavaScript Support */
    "outDir": "./dist",                                   /* Specify an output folder for all emitted files. */

    /* Interop Constraints */
    "esModuleInterop": true,                             /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */
    "forceConsistentCasingInFileNames": true,            /* Ensure that casing is correct in imports. */

    /* Type Checking */
    "strict": true,                                      /* Enable all strict type-checking options. */

    /* Completeness */
    "skipLibCheck": true                                 /* Skip type checking all .d.ts files. */
  }
}`;

const PACKAGE_JSON_TEMPLATE: TemplateContent = `{
  "name": "#{SERVER_NAME}#",
  "version": "1.0.0",
  "description": "#{SERVER_DESCRIPT}#",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "mcp",
    "server"
  ],
  "author": "mcp_server_creator",
  "license": "ISC",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.6.1",
    "express": "^5.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.9",
    "nodemon": "^3.1.9",
    "ts-node": "^10.9.2",
    "typescript": "^5.8.2"
  },
  "scripts": {
    "build": "tsc",
    "dev": "nodemon -w src/**/*.ts --exec ts-node src/index.ts"
  }
}`;

type TempResource = {
  relativeDir: string,
  name: string,
  tempContent: TemplateContent
};

type Resource = {
  relativeDir: string,
  name: string,
  content: string
};

const indexTemp: TempResource = {
  relativeDir: 'src',
  name: 'index.ts',
  tempContent: INDEX_TS_TEMPLATE
};

const packageJsonTemp: TempResource = {
  relativeDir: '',
  name: 'package.json',
  tempContent: PACKAGE_JSON_TEMPLATE
};

const tsconfigTemp: TempResource = {
  relativeDir: '',
  name: 'tsconfig.json',
  tempContent: TS_CONFIG_TEMPLATE
};

type GenFunc = (value: Record<string, string>) => Resource;

function genFileFromTemplate(tempResource: TempResource, mapping: Record<string, string>): GenFunc {
  return (value: Record<string, string>) => {
    let valueMapping: Record<string, string> = {};
    for (const mk of Object.keys(mapping)) {
      let mv = mapping[mk]
      let vv = value[mk]
      if (!!vv) {
        valueMapping[mv] = vv
      }
    }

    let { tempContent, ...rev } = tempResource;
    let tem = tempContent;
    for (const k of Object.keys(valueMapping)) {
      let v = valueMapping[k];
      tem = tem.replaceAll(k, v);
    }
    return {
      ...rev,
      content: tem
    };
  }
}
