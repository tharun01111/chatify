import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

let streamClient = null;

export const getStreamClient = () => {
  if (streamClient) return streamClient;

  if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
    return null;
  }

  streamClient = new StreamClient(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);
  return streamClient;
};
