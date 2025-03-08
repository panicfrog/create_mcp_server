import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod';
import { genMcpServerProject } from './templateWriter';

const server = new McpServer({
  name: "mcp_server_creator",
  version: "1.0.0"
});

server.tool(
  "add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }]
  })
)

server.tool(
  "generate-project",
  { serverName: z.string(), serverDescription: z.string(), rootDir: z.string() },
  async ({ serverName, serverDescription, rootDir }) => {
    try {
      genMcpServerProject({ serverName, serverDescription, rootDir })
      return {
        content: [{ type: 'text', text: "success" }]
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: 'failed' }, { type: 'text', text: `error: ${error}` }]
      }
    }
  }
)

let arglist = process.argv

if (arglist.length === 3 && arglist[2] === '--stdio') {
  let transport = new StdioServerTransport();
  (async () => {
    await server.connect(transport);
  })()
} else {
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
    console.log(`server listening on port: ${PORT}`);
  });
}

