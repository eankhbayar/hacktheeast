import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createUser, findByEmail, findById } from '../services/user';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpirySeconds,
} from '../services/jwt';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  registerValidator,
  loginValidator,
  refreshValidator,
} from '../validators/auth';
import type { User, UserResponse, RegisterRequest, LoginRequest } from '../types';

const router = Router();

function toUserResponse(user: User): UserResponse {
  return {
    userId: user.userId,
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
  };
}

router.post('/register', registerValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password, fullName, phoneNumber } = req.body as RegisterRequest;

  const existing = await findByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();
  const user: User = {
    userId: uuidv4(),
    email,
    passwordHash,
    fullName,
    phoneNumber,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await createUser(user);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ConditionalCheckFailedException') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    throw err;
  }

  const accessToken = signAccessToken(user.userId, user.email);
  const refreshToken = signRefreshToken(user.userId, user.email);

  res.status(201).json({
    accessToken,
    refreshToken,
    expiresIn: getAccessTokenExpirySeconds(),
    user: toUserResponse(user),
  });
});

router.post('/login', loginValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body as LoginRequest;

  const user = await findByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const accessToken = signAccessToken(user.userId, user.email);
  const refreshToken = signRefreshToken(user.userId, user.email);

  res.json({
    accessToken,
    refreshToken,
    expiresIn: getAccessTokenExpirySeconds(),
    user: toUserResponse(user),
  });
});

router.post('/refresh', refreshValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { refreshToken } = req.body;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const user = await findById(payload.userId);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  const accessToken = signAccessToken(user.userId, user.email);

  res.json({
    accessToken,
    expiresIn: getAccessTokenExpirySeconds(),
    user: toUserResponse(user),
  });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await findById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(toUserResponse(user));
});

export default router;
