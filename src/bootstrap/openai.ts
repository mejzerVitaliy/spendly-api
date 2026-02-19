import { environmentVariables } from '@/config';
import { TransactionType } from '@prisma/client';
import { z } from 'zod';
import OpenAI, { toFile } from 'openai';
import { Readable } from 'stream';
import { File as NodeFile } from 'node:buffer';

if (!globalThis.File) {
  (globalThis as any).File = NodeFile;
}

const CREATE_TRANSACTION_PROMPT_ID =
  'pmpt_6997184506cc8197a71d27250cdd635d03b2e0db6f42a992';

const VOICE_NORMALIZER_PROMPT_ID =
  'pmpt_6997391af2688197b19768a1c1b87402016c63f23f1baf92';

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

const voiceNormalizerResponseSchema = z.object({
  success: z.boolean(),
  normalizedText: z.string().nullable(),
  error: z.string().nullable(),
});

type VoiceNormalizerResponse = z.infer<typeof voiceNormalizerResponseSchema>;

const transcribeAudio = async (
  audioBuffer: Buffer,
  filename: string,
): Promise<string> => {
  const file = await toFile(Readable.from(audioBuffer), filename, {
    type: 'audio/m4a',
  });

  const transcript = await openai.audio.transcriptions.create({
    model: 'gpt-4o-mini-transcribe',
    file,
  });

  return transcript.text;
};

const normalizeVoiceText = async (
  transcribedText: string,
): Promise<VoiceNormalizerResponse> => {
  const response = await openai.responses.create({
    prompt: {
      id: VOICE_NORMALIZER_PROMPT_ID,
      version: '1',
      variables: {
        transcribed_text: transcribedText,
      },
    },
  });

  const raw = JSON.parse(response.output_text) as Record<string, unknown>;
  return voiceNormalizerResponseSchema.parse(raw);
};

export { parseTextTransaction, transcribeAudio, normalizeVoiceText };
export type {
  ParseTextTransactionPayload,
  ParsedTransactionItem,
  ParseTextTransactionResponse,
  VoiceNormalizerResponse,
};
