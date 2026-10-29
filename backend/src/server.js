import "dotenv/config";
import { app } from "./app.js";

const port = Number(process.env.PORT || 5000);

const server = app.listen(port, () => {
  console.log(`Fastor CRM API listening on port ${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
