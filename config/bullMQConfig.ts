import { ConnectionOptions } from "bullmq";
import ENV from "../src/schemas/env";

const connection: ConnectionOptions = {
  username: ENV?.REDISUSER,
  password: ENV?.REDISPASSWORD,
  host: ENV?.REDISHOST,
  port: ENV?.REDISPORT,
};
export default connection;
