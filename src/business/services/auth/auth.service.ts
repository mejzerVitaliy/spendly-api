import { userRepository } from "@/database/repositories/user";
import bcrypt from 'bcryptjs' 
import { 
  ACCESS_TOKEN_EXPIRATION, 
  REFRESH_TOKEN_EXPIRATION, 
  signJwtToken, 
  verifyJwtToken,
  BadRequestError,
  LoginInput, 
  RegisterInput, 
  UnauthorizedError
} from "@/business/lib";
import { JwtPayload } from "jsonwebtoken";
import { tokenService } from "@/business/services/tokens/token.service";
import { TokenType } from "@prisma/client";

const register = async (user: RegisterInput) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const createdUser = await userRepository.create({
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: hashedPassword
    }
  })

  const {accessToken, refreshToken} = await generateTokens(createdUser.id)

  return {
    createdUser,
    accessToken,
    refreshToken
  }
}

const login = async ({email, password}: LoginInput) => {
  const user = await userRepository.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive'
      }
    }
  })

  if (!user) {
    throw new BadRequestError('User not found')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw new BadRequestError('Invalid password');
  }

  const { accessToken, refreshToken } = await generateTokens(user.id);

  return {
    user,
    accessToken,
    refreshToken,
  };
}

const generateTokens = async (userId: string) => {
  const accessToken = signJwtToken(
    { userId },
    { expiresIn: ACCESS_TOKEN_EXPIRATION }
  );

  const refreshToken = signJwtToken(
    { userId },
    { expiresIn: REFRESH_TOKEN_EXPIRATION }
  );

  await tokenService.save(userId, refreshToken, TokenType.REFRESH);

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (userId: string) => {
  return await userRepository.findFirst({
    where: {
      id: userId
    }
  })
}

const refresh = async (refreshToken: string) => {
  const userData = verifyJwtToken(refreshToken) as JwtPayload;
  const token = await tokenService.getByToken(refreshToken);

  if (!userData || !token) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
    userData.userId
  );

  return {
    accessToken,
    newRefreshToken,
  };
}

export const authService = {
  register,
  login,
  getMe,
  refresh
}