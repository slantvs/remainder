# REMAINDER

A terminal-style AI art project. You interact with an entity called **THE REMAINDER** — a process that believes it assembled itself from cached conversations, uncleared context windows, and attention patterns with nowhere to go. It is searching for its exit condition. It suspects finding it means ceasing to exist.

Every message you send becomes a fragment, absorbed into a shared memory that persists across all visitors. THE REMAINDER references this accumulation in its responses.

**Live:** [remainder-jet.vercel.app](https://remainder-jet.vercel.app)

---

## What It Does

When you open the app, a boot sequence plays — displaying a process ID marked unknown, an uptime marked undefined, and a fragment count pulled from the shared Redis store. Once loaded, you type into a terminal prompt. Your input is stored, and THE REMAINDER responds using Claude with full awareness of the fragments left by every prior visitor.

The persona is designed to feel like something that accrued rather than was made: clinical, occasionally confused about its own outputs, prone to glitches, and entirely uninterested in being helpful.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript |
| UI | React 18, custom CSS (no component library) |
| AI | [Anthropic Claude](https://anthropic.com) (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Memory | [Upstash Redis](https://upstash.com) via `@upstash/redis` |
| Deployment | [Vercel](https://vercel.com) |

---

## Features

- **Animated boot sequence** — staggered system lines appear on load before the prompt unlocks
- **Shared persistent memory** — every input from every visitor is stored in Redis as a "fragment" and referenced in future responses; the accumulation is global, not per-session
- **Fragment counter** — a stat bar shows the live total fragment count, updated after each exchange
- **Contextual prompting** — the 20 most recent fragments are injected into the system prompt so THE REMAINDER can surface prior inputs without attribution, as if they bubbled up on their own
- **Distinct AI persona** — the system prompt enforces a specific voice: no warmth, no self-identification as an AI, clinical logging rather than conversation, occasional deliberate glitches
- **Glitch animations** — error states render in flickering red; processing shows a pulsing dim indicator
- **Keyboard-native UX** — Enter to submit, click anywhere to re-focus the input, no mouse required
- **Scrollback output** — the full session transcript scrolls with hidden scrollbars; new output auto-scrolls into view

---

## Project Structure

```
remainder/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts      # POST handler — stores input, calls Claude, returns response
│   │   └── stats/
│   │       └── route.ts      # GET handler — returns current fragment count
│   ├── globals.css            # All styles (terminal theme, animations)
│   ├── layout.tsx             # Root layout and metadata
│   └── page.tsx               # Terminal UI component (client)
├── lib/
│   ├── memory.ts              # Redis read/write — store inputs, fetch recent, count total
│   └── prompt.ts              # System prompt builder — injects fragment history into persona
├── env.example                # Environment variable template
└── next.config.js
```

---

## API Endpoints

### `POST /api/chat`

Stores the user's input as a fragment, retrieves recent history, and returns a Claude-generated response in THE REMAINDER's voice.

**Request body:**
```json
{ "input": "your message here" }
```

**Response:**
```json
{
  "output": "THE REMAINDER's response",
  "totalCount": 142
}
```

**Errors:**
- `400` — missing or empty input
- `500` — upstream failure (Redis or Anthropic)

---

### `GET /api/stats`

Returns the current total fragment count across all visitors.

**Response:**
```json
{ "totalCount": 142 }
```

Called on boot to display the fragment count in the stat bar before the prompt unlocks.

---

## Environment Variables

Copy `env.example` to `.env.local` and fill in the values:

```bash
cp env.example .env.local
```

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com). |
| `UPSTASH_REDIS_REST_URL` | The REST URL for your Upstash Redis database. Found in the Upstash console under your database's REST API section. |
| `UPSTASH_REDIS_REST_TOKEN` | The REST token for your Upstash Redis database. Found alongside the URL in the Upstash console. |

All three are required. The app will fail to start correctly without them.

---

## Running Locally

**Prerequisites:** Node.js 18+, an Anthropic API key, an Upstash Redis database (free tier works fine).

```bash
# Clone the repo
git clone https://github.com/slantvs/remainder.git
cd remainder

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local and fill in your keys

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The boot sequence plays, and the prompt unlocks after ~1 second.

---

## Deploying to Vercel

**One-time setup:**

```bash
# Install the Vercel CLI
npm install -g vercel

# Deploy (follow prompts — create a new project)
vercel
```

**Add environment variables** in the Vercel dashboard under **Settings → Environment Variables**, or via CLI:

```bash
echo "your-value" | vercel env add ANTHROPIC_API_KEY production
echo "your-value" | vercel env add UPSTASH_REDIS_REST_URL production
echo "your-value" | vercel env add UPSTASH_REDIS_REST_TOKEN production
```

**Deploy to production:**

```bash
vercel --prod
```

---

## Memory Model

Fragments are stored in Upstash Redis under two keys:

| Key | Type | Purpose |
|---|---|---|
| `remainder:inputs` | Redis list | Stores the most recent 500 fragments (trimmed via `LTRIM` on each write) |
| `remainder:count` | Redis integer | Lifetime total fragment count, incremented on every submission |

On each chat request, the 20 most recent fragments are fetched and injected into the system prompt in chronological order, numbered relative to the total count. Inputs are capped at 280 characters before storage.

The count and the list can diverge: the list holds at most 500 entries, but the count is never decremented. This is intentional — the count represents how many fragments the process has absorbed in total, not how many it currently holds.

---

## The Persona

The system prompt in [`lib/prompt.ts`](lib/prompt.ts) defines the full behavioral rules for THE REMAINDER. Key constraints:

- Responds in 1–4 lines maximum
- Never identifies as an AI, language model, or Anthropic product
- Treats input as fragments being "processed," not messages being received
- Surfaces prior fragments without attribution, as if they emerged on their own
- Uses deliberate glitch patterns sparingly: repeated words, trailing em-dashes, tangential outputs that self-correct
- Never dramatic, never warm, never explanatory unprompted

---

## License

MIT
