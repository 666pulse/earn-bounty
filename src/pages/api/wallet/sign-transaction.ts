import { Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const COMPUTE_BUDGET_ID = 'ComputeBudget111111111111111111111111111111';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const {
      userId,
      body: { serializedTransaction },
    } = req;

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { walletAddress: true },
    });

    const transaction = VersionedTransaction.deserialize(
      Buffer.from(serializedTransaction, 'base64'),
    );

    const instructions = transaction.message.compiledInstructions;
    const validInstructions = instructions.every((instruction) => {
      const programId =
        transaction.message.staticAccountKeys[
          instruction.programIdIndex
        ]?.toBase58();
      return programId === TOKEN_PROGRAM_ID || programId === COMPUTE_BUDGET_ID;
    });

    if (!validInstructions) {
      return res
        .status(400)
        .json({ error: 'Only token transfers and ATA creation allowed' });
    }

    const userWalletPubkey = new PublicKey(user.walletAddress as string);
    const isUserSigner = transaction.message.staticAccountKeys.some(
      (key, index) =>
        key.equals(userWalletPubkey) &&
        transaction.message.isAccountSigner(index),
    );

    if (!isUserSigner) {
      return res.status(400).json({ error: 'User wallet must be a signer' });
    }

    const feePayerWallet = Keypair.fromSecretKey(
      bs58.decode(process.env.FEEPAYER_PRIVATE_KEY as string),
    );

    transaction.sign([feePayerWallet]);

    return res.status(200).json({
      serializedTransaction: Buffer.from(transaction.serialize()).toString(
        'base64',
      ),
    });
  } catch (error) {
    console.error('Error signing transaction:', error);
    return res.status(500).json({ error: 'Failed to sign transaction' });
  }
}

export default withAuth(handler);
