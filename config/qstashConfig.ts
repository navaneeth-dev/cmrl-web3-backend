import { Client, Receiver } from "@upstash/qstash/nodejs";
import ENV from "../src/schemas/env";

export const client = new Client({ token: ENV?.QSTASH_TOKEN! });
export const receiver = new Receiver({
  currentSigningKey: ENV?.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: ENV?.QSTASH_NEXT_SIGNING_KEY!,
});
