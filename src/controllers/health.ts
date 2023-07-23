import { Request, Response } from "express";

const health = (req: Request, res: Response) => {
  res.send({ message: "Success" });
};

export default health;
