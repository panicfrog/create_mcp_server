import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'

const server = new McpServer({
  name: "mcp_server_creator",
  version: "1.0.0"
});

const app = express();
const PORT = 3001;

let transports: Record<string, SSEServerTransport> = {}

app.get("/sse", async (_, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.creator = transport;
  await server.connect(transport)
})

app.post("/messages", async (req, res) => {
  let transport = transports.creator;
  if (transport) {
    await transport.handlePostMessage(req, res)
  }
})

app.listen(PORT, () => {
  console.log(`server listening on port: ${PORT}`);
});
