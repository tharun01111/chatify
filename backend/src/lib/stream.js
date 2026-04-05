import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
  const missingCredential = !ENV.STREAM_API_KEY
    ? "STREAM_API_KEY"
    : "STREAM_API_SECRET";
  throw new Error(`Missing Stream credential: ${missingCredential}`);
}

const streamClient = new StreamClient(
  ENV.STREAM_API_KEY,
  ENV.STREAM_API_SECRET,
);

export default streamClient;
