import { environmentVariables } from '@/config';
import { z } from 'zod';
import OpenAI, { toFile } from 'openai';
import { Readable } from 'stream';
import { File as NodeFile } from 'node:buffer';

if (!globalThis.File) {
  (globalThis as any).File = NodeFile;
}

const openai = new OpenAI({
  apiKey: environmentVariables.OPENAI_API_KEY,
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const parsedTransactionItemSchema = z.object({
  transactionType: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.number().positive(),
  currencyCode: z.string().length(3),
  categoryId: z.string().uuid().nullable(),
  walletId: z.string().uuid().nullable(),
  toWalletId: z.string().uuid().nullable(),
  description: z.string(),
  date: z.string(),
});

export const parseTransactionResponseSchema = z.object({
  success: z.boolean(),
  transactions: z.array(parsedTransactionItemSchema),
  error: z.string().nullable(),
});

export type ParsedTransactionItem = z.infer<typeof parsedTransactionItemSchema>;
export type ParseTransactionResponse = z.infer<
  typeof parseTransactionResponseSchema
>;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletInfo {
  id: string;
  name: string;
  currencyCode: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  type: string;
}

export interface ParseTransactionPayload {
  mainCurrency: string;
  todayDate: string;
  categories: CategoryInfo[];
  wallets: WalletInfo[];
  userText: string;
  isVoice?: boolean;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const buildSystemPrompt = (
  mainCurrency: string,
  todayDate: string,
  categories: CategoryInfo[],
  wallets: WalletInfo[],
  isVoice: boolean,
): string =>
  `You are a financial transaction parser inside a finance app.
Convert ${isVoice ? 'transcribed voice input (ignore fillers: "um","uh","ну","типа","эээ", repeated/stuttered words)' : 'natural language text'} into a valid JSON object.

Return ONLY valid JSON. No explanations, no markdown, no extra fields.

TODAY: ${todayDate}
MAIN CURRENCY: ${mainCurrency}
WALLETS: ${wallets.length > 0 ? JSON.stringify(wallets) : '[]'}
CATEGORIES: ${JSON.stringify(categories)}

OUTPUT SCHEMA:
{
  "success": boolean,
  "transactions": [{
    "transactionType": "INCOME"|"EXPENSE"|"TRANSFER",
    "amount": number,         // smallest unit: 10 USD→1000, 50.25 EUR→5025
    "currencyCode": string,   // ISO 4217, exactly 3 chars
    "categoryId": string|null,
    "walletId": string|null,
    "toWalletId": string|null,
    "description": string,
    "date": string            // ISO 8601 UTC e.g. "2026-01-15T00:00:00.000Z"
  }],
  "error": string|null
}

TRANSACTION TYPES:
- EXPENSE: money spent, paid, bought, "потратил", "заплатил"
- INCOME: money received, earned, got, salary, "получил", "заработал"
- TRANSFER: money moved between user's own wallets ("transfer", "move to", "перевел", "перевод между кошельками")

TRANSFER RULES:
- walletId = source wallet UUID (FROM) — match from WALLETS by name
- toWalletId = destination wallet UUID (TO) — match from WALLETS by name
- categoryId = null
- amount in source wallet's currency; currencyCode = source wallet's currency
- If wallet names not mentioned or not found in list: use null

INCOME/EXPENSE RULES:
- toWalletId = null always
- walletId = match from WALLETS by name (case-insensitive, partial ok), else null
- categoryId = UUID from CATEGORIES whose semantic meaning matches AND whose type matches the transaction type; else null
- Category matching is language-agnostic: "продукты"/"еда"→Food, "зарплата"→Salary, "такси"→Transport

AMOUNT: always in smallest currency unit (cents). 10.50 USD = 1050. 200 UAH = 20000.
CURRENCY: explicit mention in input overrides main currency.
  Spoken: dollars/bucks→USD, euros/евро→EUR, UAH/гривен/грн→UAH, lei/лей→MDL, pounds→GBP
  If no currency mentioned: use ${mainCurrency}.

DATE: ISO 8601 UTC format. Relative dates calculated from TODAY=${todayDate}.
  "yesterday"→day before today, "2 days ago"→2 days before today.
  No time specified → use T00:00:00.000Z.
  No date specified → use today.

MULTIPLE TRANSACTIONS: return a separate object for each financial event. Never merge amounts.
  "bought food 200 and paid 600 gym" → 2 objects.
  "получил зп 1000 долларов и потратил 100 на налоги" → 2 objects (INCOME 1000 USD + EXPENSE 100 USD).

ERROR: if input has no valid financial transaction, no amount, or is meaningless:
  Return: { "success": false, "transactions": [], "error": "<short friendly message in the SAME language as user input>" }
  Error must NOT mention JSON/parsing/AI/schema/technical details.
SUCCESS: { "success": true, "transactions": [...], "error": null }`;

// ─── Parse Transaction ────────────────────────────────────────────────────────

export const parseTransaction = async (
  payload: ParseTransactionPayload,
): Promise<ParseTransactionResponse> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(
          payload.mainCurrency,
          payload.todayDate,
          payload.categories,
          payload.wallets,
          payload.isVoice ?? false,
        ),
      },
      { role: 'user', content: payload.userText },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { success: false, transactions: [], error: 'No response from AI' };
  }

  try {
    const raw = JSON.parse(content) as Record<string, unknown>;
    return parseTransactionResponseSchema.parse(raw);
  } catch {
    return {
      success: false,
      transactions: [],
      error: 'Failed to parse AI response',
    };
  }
};

// ─── Audio Transcription ──────────────────────────────────────────────────────

export const transcribeAudio = async (
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

export type { ParsedTransactionItem as ParsedAITransactionItem };
