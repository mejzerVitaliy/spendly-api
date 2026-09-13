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

// What the model actually emits. Deliberately not the shape above: it refers
// to categories/wallets by their index in the prompt's numbered lists rather
// than by UUID, and uses a bare YYYY-MM-DD date. A UUID costs ~20 output
// tokens each and is a hallucination risk (the model has to copy 36 chars
// exactly); an index costs one. Output tokens are generated serially, so
// this is the single biggest lever on how long the user waits. Mapped back
// to real ids in resolveParsedItem below, so callers still get UUIDs.
const modelTransactionItemSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.number(),
  currency: z.string(),
  category: z.number().nullable(),
  wallet: z.number().nullable(),
  toWallet: z.number().nullable(),
  description: z.string(),
  date: z.string(),
});

const modelResponseSchema = z.object({
  success: z.boolean(),
  transactions: z.array(modelTransactionItemSchema),
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

// Split in two so the long, identical-for-everyone half sits at the very
// front of the request: OpenAI caches prompt prefixes automatically, and the
// cache keys on the longest COMMON prefix, so anything user- or day-specific
// mixed into the top (the old layout put TODAY/MAIN CURRENCY/wallets there)
// busts the cache for every request. Static rules + the global category list
// first, per-user tail last.

const STATIC_RULES = `You are a financial transaction parser inside a finance app.
Convert the user's message into a JSON object. Return ONLY JSON - no prose, no markdown.

OUTPUT SCHEMA:
{
  "success": boolean,
  "transactions": [{
    "type": "INCOME"|"EXPENSE"|"TRANSFER",
    "amount": number,      // smallest unit (cents): 10.50 → 1050, 200 → 20000
    "currency": string,    // ISO 4217, 3 chars
    "category": number|null, // INDEX from the CATEGORIES list below, never a name
    "wallet": number|null,   // INDEX from the WALLETS list below
    "toWallet": number|null, // INDEX, TRANSFER only
    "description": string,   // what was bought, "" if not stated
    "date": string           // YYYY-MM-DD
  }],
  "error": string|null
}

TYPES:
- EXPENSE: spent, paid, bought, "потратил", "заплатил", "купил"
- INCOME: received, earned, salary, "получил", "заработал", "зп"
- TRANSFER: money moved between the user's OWN wallets ("перевёл", "transfer to")

RULES:
- category: pick the index whose meaning matches AND whose type matches the
  transaction type. Language-agnostic: "продукты"/"еда"→Food, "зп"→Salary,
  "такси"→Transport. No match, or nothing stated → null. TRANSFER → always null.
- wallet/toWallet: match a wallet by name (case-insensitive, partial ok), else null.
  For non-TRANSFER, toWallet is always null.
- amount: always cents. TRANSFER amount is in the source wallet's currency.
- MULTIPLE EVENTS → one object each, never merged: "купил еду 200 и заплатил 600 за зал" → 2.

CURRENCY: match by MEANING, not spelling - this is casual speech or voice
transcription in Russian/Ukrainian/Romanian/English, so expect every grammatical
case, plural and diminutive, not the dictionary form:
- MDL: lei, leu, лей, лея, лею, леев, леи
- UAH: hryvnia, гривна, гривны, гривен, гривню, грн
- USD: dollars, bucks, доллар, долларов, баксы, баксов, $
- EUR: euro, евро, €    GBP: pounds, фунты, фунтов, £
Unrecognized currency word → infer the closest by sound/root. Only fall back to
the user's main currency when NO currency is mentioned at all.

DATE: relative to TODAY given below. "вчера"/"yesterday" → previous day,
"2 дня назад" → two days before. Nothing stated → today.

BIAS TOWARD SUCCESS: a number plus a spend/receive/transfer verb IS a valid
transaction, however terse - "потратил 66 лей", "spent 20", "получил 500" are all
complete on their own. A missing category or description is NEVER a reason to
reject. Return success:false only when there is no amount at all, or the text has
nothing to do with money (greetings, questions, gibberish). When torn, choose
success:true with your best guess - the user reviews and edits before it's saved,
so a wrong guess costs one tap while a rejection makes the feature look broken.

ERROR (non-financial input only): {"success":false,"transactions":[],"error":"<short,
friendly, in the user's own language, never mentioning JSON/AI/parsing>"}`;

const VOICE_NOTE = `
INPUT IS VOICE TRANSCRIPTION: ignore fillers ("um","uh","ну","типа","эээ") and
stuttered/repeated words. Numbers may be spelled out - convert them.`;

const buildSystemPrompt = (
  mainCurrency: string,
  todayDate: string,
  categories: CategoryInfo[],
  wallets: WalletInfo[],
  isVoice: boolean,
): string =>
  `${STATIC_RULES}${isVoice ? VOICE_NOTE : ''}

CATEGORIES (index:name:type):
${categories.map((c, i) => `${i}:${c.name}:${c.type === 'INCOME' ? 'IN' : 'EX'}`).join('\n')}

WALLETS (index:name:currency):
${wallets.length > 0 ? wallets.map((w, i) => `${i}:${w.name}:${w.currencyCode}`).join('\n') : '(none)'}

TODAY: ${todayDate}
MAIN CURRENCY: ${mainCurrency}`;

// ─── Parse Transaction ────────────────────────────────────────────────────────

// Mirrors parseTransactionResponseSchema. OpenAI's strict Structured Outputs
// mode requires every property listed in `required` and `additionalProperties:
// false` on every object - optionality is expressed as a `[type, "null"]`
// union instead of an optional key. Keeping this in sync with the zod schema
// by hand (rather than generating it) since the shape rarely changes and it
// keeps the strict-mode constraints explicit.
const PARSE_TRANSACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE', 'TRANSFER'],
          },
          amount: { type: 'number' },
          currency: { type: 'string' },
          category: { type: ['integer', 'null'] },
          wallet: { type: ['integer', 'null'] },
          toWallet: { type: ['integer', 'null'] },
          description: { type: 'string' },
          date: { type: 'string' },
        },
        required: [
          'type',
          'amount',
          'currency',
          'category',
          'wallet',
          'toWallet',
          'description',
          'date',
        ],
        additionalProperties: false,
      },
    },
    error: { type: ['string', 'null'] },
  },
  required: ['success', 'transactions', 'error'],
  additionalProperties: false,
} as const;

/**
 * Turns one model-emitted item (indices + YYYY-MM-DD) into the UUID/ISO shape
 * the rest of the app already works with. Out-of-range indices become null
 * rather than throwing - a bad index is the model guessing badly at a
 * category, which the user can fix in the confirmation dialog, not a reason
 * to fail the whole request.
 */
const resolveParsedItem = (
  item: z.infer<typeof modelTransactionItemSchema>,
  categories: CategoryInfo[],
  wallets: WalletInfo[],
): ParsedTransactionItem => {
  const at = <T>(list: T[], index: number | null): T | undefined =>
    index === null || index < 0 || index >= list.length
      ? undefined
      : list[index];

  const isTransfer = item.type === 'TRANSFER';
  const category = isTransfer ? undefined : at(categories, item.category);

  // The model is told to emit YYYY-MM-DD; accept a full ISO string too rather
  // than rejecting it, since that costs nothing and the old prompt asked for
  // exactly that.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    ? `${item.date}T00:00:00.000Z`
    : item.date;

  return {
    transactionType: item.type,
    amount: Math.round(Math.abs(item.amount)),
    currencyCode: item.currency.toUpperCase().slice(0, 3),
    categoryId: category?.id ?? null,
    walletId: at(wallets, item.wallet)?.id ?? null,
    toWalletId: isTransfer ? (at(wallets, item.toWallet)?.id ?? null) : null,
    description: item.description,
    date,
  };
};

// The user is staring at a spinner for this entire call, so the budget is
// tight on purpose: a request that has not answered in 12s is not going to
// produce a usable experience anyway, and failing fast leaves room for the
// single retry below inside a sane total wait.
const AI_REQUEST_TIMEOUT_MS = 12_000;

// One object is ~60 tokens in the index-based shape, so this still allows a
// handful of transactions from one sentence while capping the worst case -
// output tokens are generated serially and are the dominant cost in latency.
const AI_MAX_OUTPUT_TOKENS = 400;

const runParseAttempt = async (
  payload: ParseTransactionPayload,
): Promise<{ content: string; cachedTokens: number }> => {
  const response = await openai.chat.completions.create(
    {
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: AI_MAX_OUTPUT_TOKENS,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'parse_transaction_response',
          strict: true,
          schema: PARSE_TRANSACTION_JSON_SCHEMA,
        },
      },
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
    },
    // The SDK retries 429/5xx on its own by default (2x), which would stack
    // under our own 2-attempt loop below and let a bad upstream minute turn
    // into a worst case of 4 sequential 12s timeouts - comfortably past what
    // the mobile client itself waits for. Our loop already retries and logs,
    // so disable the SDK's: bounded worst case is 2 x 12s, safely inside it.
    { timeout: AI_REQUEST_TIMEOUT_MS, maxRetries: 0 },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }
  return {
    content,
    cachedTokens: response.usage?.prompt_tokens_details?.cached_tokens ?? 0,
  };
};

const parseAndValidate = (
  content: string,
  payload: ParseTransactionPayload,
): ParseTransactionResponse => {
  const raw = JSON.parse(content) as Record<string, unknown>;
  const model = modelResponseSchema.parse(raw);

  return {
    success: model.success,
    transactions: model.transactions
      // A zero/NaN amount is the one thing the confirmation dialog cannot
      // rescue, so drop those items rather than handing the user a broken row.
      .filter((item) => Number.isFinite(item.amount) && item.amount !== 0)
      .map((item) =>
        resolveParsedItem(item, payload.categories, payload.wallets),
      ),
    error: model.error,
  };
};

export const parseTransaction = async (
  payload: ParseTransactionPayload,
): Promise<ParseTransactionResponse> => {
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= 2; attempt++) {
    let content: string | undefined;
    try {
      const result = await runParseAttempt(payload);
      content = result.content;
      const parsed = parseAndValidate(content, payload);
      console.info('[AI][parseTransaction] ok', {
        ms: Date.now() - startedAt,
        attempt,
        // 0 here means the cacheable prefix is not being reused - worth
        // watching, since a cache hit is roughly half the time to first token.
        cachedTokens: result.cachedTokens,
        transactions: parsed.transactions.length,
      });
      return parsed;
    } catch (err) {
      // Structured Outputs guarantees schema-conforming JSON, so this should
      // be rare - but when the model still misfires (or the request itself
      // fails), log the raw content so the failure is actually diagnosable
      // instead of silently collapsing into a generic user-facing message.
      console.error(
        `[AI][parseTransaction] attempt ${attempt}/2 failed`,
        { rawContent: content, userText: payload.userText },
        err,
      );
      if (attempt === 2) {
        return {
          success: false,
          transactions: [],
          error: 'Failed to parse AI response',
        };
      }
    }
  }
  // Unreachable - the loop always returns or throws above.
  return {
    success: false,
    transactions: [],
    error: 'Failed to parse AI response',
  };
};

// ─── Audio Transcription ──────────────────────────────────────────────────────

export const transcribeAudio = async (
  audioBuffer: Buffer,
  filename: string,
): Promise<string> => {
  const file = await toFile(Readable.from(audioBuffer), filename, {
    type: 'audio/m4a',
  });

  try {
    const transcript = await openai.audio.transcriptions.create(
      {
        model: 'gpt-4o-mini-transcribe',
        file,
      },
      // These are a few seconds of speech, not a long recording, so 15s is
      // already generous. Also cap the SDK's own retries at 1 (default is
      // 2, i.e. 3 attempts): this call has no outer retry loop of its own,
      // so left at the default a bad upstream stretch could stack 3 x 30s
      // before failing - most of the mobile client's voice request budget
      // gone before the (separate, also-retried) parse step even starts.
      { timeout: 15_000, maxRetries: 1 },
    );

    return transcript.text;
  } catch (err) {
    console.error('[AI][transcribeAudio] transcription request failed', err);
    throw err;
  }
};

export type { ParsedTransactionItem as ParsedAITransactionItem };

// ─── Financial Insights ───────────────────────────────────────────────────────

export interface FinancialInsightsPayload {
  period: string;
  currencyCode: string;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  totalTransactions: number;
  incomeCount: number;
  expenseCount: number;
  topExpenses: Array<{ label: string; value: number; percentage: number }>;
  topIncomes: Array<{ label: string; value: number; percentage: number }>;
}

export interface FinancialInsightItem {
  icon: string;
  title: string;
  content: string;
  type: 'overview' | 'pattern' | 'recommendation';
}

const VALID_INSIGHT_ICONS = [
  'bar-chart-outline',
  'eye-outline',
  'bulb-outline',
  'trending-up-outline',
  'trending-down-outline',
  'wallet-outline',
  'shield-checkmark-outline',
  'alert-circle-outline',
  'star-outline',
  'cash-outline',
  'analytics-outline',
];

export const generateFinancialInsights = async (
  data: FinancialInsightsPayload,
  language: string,
): Promise<FinancialInsightItem[]> => {
  const isRu = language === 'ru';
  const fmt = (cents: number) =>
    (cents / 100).toLocaleString('en', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  const c = data.currencyCode;

  const topExpensesStr =
    data.topExpenses.length > 0
      ? data.topExpenses
          .map((e) => `${e.label}: ${fmt(e.value)} ${c} (${e.percentage}%)`)
          .join('; ')
      : isRu
        ? 'нет данных'
        : 'no data';

  const topIncomesStr =
    data.topIncomes.length > 0
      ? data.topIncomes
          .map((i) => `${i.label}: ${fmt(i.value)} ${c} (${i.percentage}%)`)
          .join('; ')
      : isRu
        ? 'нет данных'
        : 'no data';

  const lang = isRu
    ? 'Ты персональный финансовый помощник в приложении Spendly. Отвечай СТРОГО на русском языке.'
    : 'You are a personal finance coach inside Spendly app. Respond in English.';

  const prompt = `${lang}

Financial data (${data.period}):
- ${isRu ? 'Доходы' : 'Income'}: ${fmt(data.totalIncome)} ${c}
- ${isRu ? 'Расходы' : 'Expenses'}: ${fmt(data.totalExpense)} ${c}
- ${isRu ? 'Итого' : 'Net'}: ${fmt(data.netChange)} ${c}
- ${isRu ? 'Транзакций' : 'Transactions'}: ${data.totalTransactions} (${data.incomeCount} ${isRu ? 'доходов' : 'income'}, ${data.expenseCount} ${isRu ? 'расходов' : 'expense'})
- ${isRu ? 'Топ расходы' : 'Top expenses'}: ${topExpensesStr}
- ${isRu ? 'Топ доходы' : 'Top income'}: ${topIncomesStr}

Return ONLY valid JSON, no markdown, no explanation:
{
  "insights": [
    { "icon": "bar-chart-outline", "title": "...", "content": "...", "type": "overview" },
    { "icon": "eye-outline", "title": "...", "content": "...", "type": "pattern" },
    { "icon": "bulb-outline", "title": "...", "content": "...", "type": "recommendation" }
  ]
}

Rules:
- title: 3-5 words
- content: 1-2 sentences, use real numbers from the data
- type must be exactly: overview, pattern, or recommendation
- icon must be one of: ${VALID_INSIGHT_ICONS.join(', ')}
- Be specific and concrete, avoid generic advice`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 700,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.choices[0]?.message?.content ?? '';
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as { insights?: unknown[] };
    const validTypes = ['overview', 'pattern', 'recommendation'] as const;

    return (parsed.insights ?? []).slice(0, 3).map((item) => {
      const i = item as Record<string, unknown>;
      const type = validTypes.includes(i.type as (typeof validTypes)[number])
        ? (i.type as (typeof validTypes)[number])
        : 'overview';
      return {
        icon: VALID_INSIGHT_ICONS.includes(i.icon as string)
          ? (i.icon as string)
          : 'bulb-outline',
        title: typeof i.title === 'string' ? i.title : '',
        content: typeof i.content === 'string' ? i.content : '',
        type,
      };
    });
  } catch {
    return [];
  }
};
