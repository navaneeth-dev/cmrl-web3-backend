import { Client } from "@upstash/qstash/nodejs";
import ENV from "../src/schemas/env";

const client = new Client({ token: ENV?.QSTASH_TOKEN! });
export default client;
