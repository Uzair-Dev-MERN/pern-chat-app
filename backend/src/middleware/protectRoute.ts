import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import prisma from "../db/prisma.ts";

interface DecodedToken extends JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    export interface Request {
      user: {
        id: string;
      };
    }
  }
}

const protectRoute = async (req: Request, res: Response, next: any) => {
  const token = req.cookies.jwt;

  if (!token) {
    res.status(401).json({ error: "UnAuthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    if (!decoded) {
      res.status(401).json({ error: "UnAuthorized | Invalid Token" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, fullName: true, profilePic: true },
    });

    if (!user) {
      res.status(401).json({ error: "User No Found" });
      return;
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ error: "Internal Server error" });
    return;
  }
};

export default protectRoute;
