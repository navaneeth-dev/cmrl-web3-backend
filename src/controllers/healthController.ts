import { Request, Response } from "express";

const healthController = (req: Request, res: Response) => {
  res.send({ message: "Success" });
};

export default healthController;
