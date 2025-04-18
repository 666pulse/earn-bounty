import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  type Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { type NextApiResponse } from 'next';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';
import { getConnection } from '@/features/wallet/utils/getConnection';
import { withdrawFormSchema } from '@/features/wallet/utils/withdrawFormSchema';

const tokenProgramCache: Record<string, string> = {};

async function isToken2022Token(
  connection: Connection,
  mintAddress: string,
): Promise<boolean> {
  if (mintAddress === 'So11111111111111111111111111111111111111112')
    return false;
  if (tokenProgramCache[mintAddress]) {
    return tokenProgramCache[mintAddress] === TOKEN_2022_PROGRAM_ID.toString();
  }
  try {
    const mintInfo = await connection.getAccountInfo(
      new PublicKey(mintAddress),
    );
    if (!mintInfo) {
      logger.error(`Mint account not found: ${mintAddress}`);
      return false;
    }
    tokenProgramCache[mintAddress] = mintInfo.owner.toString();
    return mintInfo.owner.toString() === TOKEN_2022_PROGRAM_ID.toString();
  } catch (error) {
    logger.error(`Error checking token program: ${safeStringify(error)}`);
    return false;
  }
}

async function calculateAtaCreationCost(
  tokenAddress: string,
  decimals: number,
): Promise<number> {
  const tokenUSDValue = await fetchTokenUSDValue(tokenAddress);
  const solUSDValue = await fetchTokenUSDValue(
    'So11111111111111111111111111111111111111112',
  );
  const ataCreationCostInUSD = solUSDValue * 0.0021;
  const tokenAmountToCharge = ataCreationCostInUSD / tokenUSDValue;
  return Math.ceil(tokenAmountToCharge * 10 ** decimals);
}

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { userId, body } = req;
  try {
    const validatedBody = withdrawFormSchema.parse(body);
    const { recipientAddress, amount, tokenAddress } = validatedBody;

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { walletAddress: true },
    });
    if (!user.walletAddress) throw new Error('User wallet address not found');

    const connection = getConnection('confirmed');
    const { blockhash } = await connection.getLatestBlockhash('finalized');

    const sender = new PublicKey(user.walletAddress);
    const recipient = new PublicKey(recipientAddress);
    const tokenMint = new PublicKey(tokenAddress);
    const feePayerWallet = Keypair.fromSecretKey(
      bs58.decode(process.env.FEEPAYER_PRIVATE_KEY as string),
    );
    const feePayer = feePayerWallet.publicKey;

    if (!process.env.FEEPAYER_PRIVATE_KEY)
      throw new Error('Fee payer private key not configured');

    if (tokenAddress === 'So11111111111111111111111111111111111111112') {
      const instructions = [
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: recipient,
          lamports: LAMPORTS_PER_SOL * Number(amount),
        }),
      ];
      const message = new TransactionMessage({
        payerKey: feePayer,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);
      transaction.sign([feePayerWallet]);

      return res.status(200).json({
        serializedTransaction: Buffer.from(transaction.serialize()).toString(
          'base64',
        ),
        receiverATAExists: true,
        ataCreationCost: 0,
      });
    }

    const isToken2022 = await isToken2022Token(connection, tokenAddress);
    const programId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

    const token = tokenList.find((e) => e.mintAddress === tokenAddress);
    if (!token) throw new Error('Invalid token selected');
    const decimals = token.decimals;

    const senderATA = getAssociatedTokenAddressSync(
      tokenMint,
      sender,
      false,
      programId,
    );
    const receiverATA = getAssociatedTokenAddressSync(
      tokenMint,
      recipient,
      false,
      programId,
    );
    const receiverATAExists = !!(await connection.getAccountInfo(receiverATA));
    const receiverATAWasMissing = !receiverATAExists;

    const allInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 40000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
    ];

    let ataCreationCost = 0;
    const withdrawAmount = Number(amount) * 10 ** decimals;

    if (receiverATAWasMissing) {
      ataCreationCost = await calculateAtaCreationCost(tokenAddress, decimals);
      logger.info(
        `ATA creation cost: ${ataCreationCost} tokens (${token.tokenSymbol})`,
      );

      allInstructions.push(
        createAssociatedTokenAccountInstruction(
          feePayer,
          receiverATA,
          recipient,
          tokenMint,
          programId,
        ),
      );

      const feePayerATA = getAssociatedTokenAddressSync(
        tokenMint,
        feePayer,
        false,
        programId,
      );
      const feePayerATAExists =
        !!(await connection.getAccountInfo(feePayerATA));

      if (!feePayerATAExists && ataCreationCost > 0) {
        allInstructions.push(
          createAssociatedTokenAccountInstruction(
            feePayer,
            feePayerATA,
            feePayer,
            tokenMint,
            programId,
          ),
        );
      }

      if (ataCreationCost > 0) {
        allInstructions.push(
          createTransferInstruction(
            senderATA,
            feePayerATA,
            sender,
            ataCreationCost,
            [],
            programId,
          ),
        );
        allInstructions.push(
          createTransferInstruction(
            senderATA,
            receiverATA,
            sender,
            withdrawAmount - ataCreationCost,
            [],
            programId,
          ),
        );
      } else {
        allInstructions.push(
          createTransferInstruction(
            senderATA,
            receiverATA,
            sender,
            withdrawAmount,
            [],
            programId,
          ),
        );
      }
    } else {
      allInstructions.push(
        createTransferInstruction(
          senderATA,
          receiverATA,
          sender,
          withdrawAmount,
          [],
          programId,
        ),
      );
    }

    const message = new TransactionMessage({
      payerKey: feePayer,
      recentBlockhash: blockhash,
      instructions: allInstructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(message);
    transaction.sign([feePayerWallet]);

    return res.status(200).json({
      serializedTransaction: Buffer.from(transaction.serialize()).toString(
        'base64',
      ),
      receiverATAExists: !receiverATAWasMissing,
      ataCreationCost: receiverATAWasMissing ? ataCreationCost : 0,
    });
  } catch (error: any) {
    logger.error(
      `Failed to create transfer transaction for user ${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({ error: error.message });
  }
}

export default withAuth(handler);
