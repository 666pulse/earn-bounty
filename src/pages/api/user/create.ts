import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';

export default async function newUser(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const privyDid = await getPrivyToken(req);
    const { email } = req.body;

    if (!privyDid || !email) {
      logger.warn('Unauthorized request - Missing token or email');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { privyDid },
    });

    if (existingUser) {
      logger.warn(`User already exists with privyDid: ${privyDid}`);
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = await prisma.user.create({
      data: { privyDid, email },
    });

    logger.debug(`Created new user with ID: ${user.id}`);
    return res.status(200).json({
      message: `Created new user with ID: ${user.id}`,
    });

    // const invite = await prisma.userInvites.findFirst({
    //   where: { email: user.email },
    //   orderBy: { createdAt: 'desc' },
    // });
    //
    // const hasInvite = user && invite;
    //
    // if (!hasInvite) {
    //   logger.info('User does not have an invite, redirecting to onboarding');
    //   return res.status(200).json({
    //     message: 'User does not have an invite, redirecting to onboarding',
    //   });
    // } else {
    //   const result = await handleInviteAcceptance(user.id);
    //   logger.info('User has an invite, redirecting to dashboard');
    //   return res.status(307).redirect(result.redirectUrl!);
    // }
  } catch (error: any) {
    logger.error(
      `Error occurred while creating new user: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error,
      message: 'Error occurred while creating new user.',
    });
  }
}
