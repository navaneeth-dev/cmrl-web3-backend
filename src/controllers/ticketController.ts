import { Request, Response } from "express";

const tickerController = (req: Request, res: Response) => {
  res.send("gi");
};

export default tickerController;
