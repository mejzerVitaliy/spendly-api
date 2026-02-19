import { environmentVariables } from '@/config';
import { TransactionType } from '@prisma/client';
import { z } from 'zod';
import OpenAI from 'openai';

const CREATE_TRANSACTION_PROMPT_ID =
  'pmpt_6997184506cc8197a71d27250cdd635d03b2e0db6f42a992';

const openai = new OpenAI({
  apiKey: environmentVariables.OPENAI_API_KEY,
});

interface ParseTextTransactionPayload {
  mainCurrency: string;
  todayDate: string;
  categories: {
    id: string;
    name: string;
    type: TransactionType;
  }[];
  userText: string;
}

const parsedTransactionItemSchema = z.object({
  amount: z.number().positive(),
  currencyCode: z.string().length(3),
  type: z.nativeEnum(TransactionType),
  categoryId: z.string().uuid().nullable(),
  walletId: z.string().uuid().nullable(),
  description: z.string(),
  date: z.string(),
});

const parseTextTransactionResponseSchema = z.object({
  success: z.boolean(),
  transactions: z.array(parsedTransactionItemSchema),
  error: z.string().nullable(),
});

type ParsedTransactionItem = z.infer<typeof parsedTransactionItemSchema>;
type ParseTextTransactionResponse = z.infer<
  typeof parseTextTransactionResponseSchema
>;

const parseTextTransaction = async (
  payload: ParseTextTransactionPayload,
): Promise<ParseTextTransactionResponse> => {
  const response = await openai.responses.create({
    prompt: {
      id: CREATE_TRANSACTION_PROMPT_ID,
      variables: {
        main_currency: payload.mainCurrency,
        today_date: payload.todayDate,
        categories: JSON.stringify(payload.categories),
        user_text: payload.userText,
      },
    },
  });

  const raw = JSON.parse(response.output_text) as Record<string, unknown>;
  const parsed = parseTextTransactionResponseSchema.parse(raw);

  return parsed;
};

export { parseTextTransaction };
export type {
  ParseTextTransactionPayload,
  ParsedTransactionItem,
  ParseTextTransactionResponse,
};
