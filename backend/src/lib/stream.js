import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

const streamClient = new StreamClient(
    ENV.STREAM_API_KEY,
    ENV.STREAM_API_SECRET
);

export default streamClient;