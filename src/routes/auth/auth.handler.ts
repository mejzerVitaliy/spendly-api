import { FastifyReply, FastifyRequest } from 'fastify';
import {
  GuestInput,
  LoginInput,
  RefreshTokenInput,
  RefreshTokenResponse,
  RegisterInput,
  UnauthorizedError,
  UpgradeGuestInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@/business';
import { authService } from '@/business/services/auth/auth.service';
import { analyticsService } from '@/business/services/analytics/analytics.service';
import { JwtPayload } from 'jsonwebtoken';
import { tokenService } from '@/business/services/tokens/token.service';
import { TokenType } from '@prisma/client';

const guest = async (
  req: FastifyRequest<{
    Body: GuestInput;
  }>,
  reply: FastifyReply,
) => {
  const { body } = req;

  const { createdUser, accessToken, refreshToken } =
    await authService.createGuest(body);

  analyticsService.track('guest_created', createdUser.id, {
    currency: body.mainCurrencyCode,
  });

  const response = {
    message: 'Guest user created successfully',
    data: {
      user: createdUser,
      accessToken,
      refreshToken,
    },
  };

  reply.send(response);
};

const upgradeGuest = async (
  req: FastifyRequest<{
    Body: UpgradeGuestInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { body } = req;

  const { user, accessToken, refreshToken } = await authService.upgradeGuest(
    userId,
    body,
  );

  analyticsService.track('account_upgraded', userId);

  const response = {
    message: 'Guest upgraded to registered user successfully',
    data: {
      user,
      accessToken,
      refreshToken,
    },
  };

  reply.send(response);
};

const register = async (
  req: FastifyRequest<{
    Body: RegisterInput;
  }>,
  reply: FastifyReply,
) => {
  const { body } = req;

  const { createdUser, accessToken, refreshToken } =
    await authService.register(body);

  analyticsService.track('signup_completed', createdUser.id);

  const response = {
    message: 'User is registered successfully',
    data: {
      user: createdUser,
      accessToken,
      refreshToken,
    },
  };

  reply.send(response);
};

const login = async (
  request: FastifyRequest<{
    Body: LoginInput;
  }>,
  reply: FastifyReply,
) => {
  const { body } = request;

  const data = await authService.login(body);

  analyticsService.track('login_completed', data.user?.id);

  const response = {
    message: 'User is logged in successfully',
    data,
  };

  reply.send(response);
};

const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as JwtPayload;

  const data = await authService.getMe(userId);

  const response = {
    message: 'User is fetched successfully',
    data,
  };

  reply.send(response);
};

const refresh = async (
  request: FastifyRequest<{
    Body: RefreshTokenInput;
  }>,
  reply: FastifyReply,
) => {
  const { refreshToken } = request.body;

  if (!refreshToken) {
    throw UnauthorizedError('Refresh token is missing');
  }

  const { accessToken, newRefreshToken } =
    await authService.refresh(refreshToken);

  const response: RefreshTokenResponse = {
    message: 'Tokens refreshed successfully',
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  };

  return reply.send(response);
};

const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as JwtPayload;

  await tokenService.removeAllByUserId(userId, TokenType.REFRESH);

  analyticsService.track('logout', userId);

  const response = {
    message: 'User is logged out successfully',
  };

  reply.send(response);
};

const forgotPassword = async (
  request: FastifyRequest<{ Body: ForgotPasswordInput }>,
  reply: FastifyReply,
) => {
  await authService.forgotPassword(request.body);

  reply.send({ message: 'If that email exists, a reset link has been sent' });
};

const resetPasswordRedirect = async (
  request: FastifyRequest<{ Querystring: { token?: string } }>,
  reply: FastifyReply,
) => {
  const token = request.query.token ?? '';
  const deepLink = `spendlymobile://reset-password?token=${encodeURIComponent(token)}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Opening Spendly AI…</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #080808; color: #F2F2F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { text-align: center; padding: 48px 32px; max-width: 360px; }
    .logo { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #38E8FF, #22D3EE); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 32px; }
    p { color: #737373; font-size: 15px; margin-bottom: 28px; line-height: 1.6; }
    a.btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #38E8FF, #22D3EE, #0EA5C9); color: #080808; font-weight: 600; font-size: 15px; border-radius: 12px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Spendly AI</div>
    <p>Tap the button below to open the app and reset your password.</p>
    <a class="btn" href="${deepLink}">Open Spendly AI →</a>
  </div>
  <script>setTimeout(function(){ window.location.href = "${deepLink}"; }, 300);</script>
</body>
</html>`;

  reply.type('text/html').send(html);
};

const resetPassword = async (
  request: FastifyRequest<{ Body: ResetPasswordInput }>,
  reply: FastifyReply,
) => {
  await authService.resetPassword(request.body);

  reply.send({ message: 'Password reset successfully' });
};

export const authHandler = {
  guest,
  upgradeGuest,
  register,
  login,
  getMe,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  resetPasswordRedirect,
};
