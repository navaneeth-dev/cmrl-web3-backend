import pino from "pino";

// const envToLogger = {
//   development: {
//     transport: {
//       target: "pino-pretty",
//     },
//   },
// };
const logger = pino();
export default logger;
