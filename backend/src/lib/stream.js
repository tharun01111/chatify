import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

let streamClient = null;
let hasWarnedAboutMissingStreamConfig = false;

export const getStreamClient = () => {
  if (streamClient) return streamClient;

  if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
    if (!hasWarnedAboutMissingStreamConfig) {
      hasWarnedAboutMissingStreamConfig = true;
      console.warn("Stream video is disabled because STREAM_API_KEY or STREAM_API_SECRET is missing.");
    }
    return null;
  }

  streamClient = new StreamClient(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);
  return streamClient;
};
