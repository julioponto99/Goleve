import { NextFunction, Request, Response } from 'express';
import { validateLogin, validateRegister } from '../config/validation';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json(await authService.register(validateRegister(req.body)));
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await authService.login(validateLogin(req.body)));
  } catch (error) {
    next(error);
  }
}

export async function me(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ user: await authService.currentUser(res.locals.userId as string) });
  } catch (error) {
    next(error);
  }
}
