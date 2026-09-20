# Locksmith Playtest Runbook

**Windows:** Sep 26–27, 2026. **Data freeze:** Oct 3.

The game runs on the laptop and is exposed through a Cloudflare tunnel for the length of a
session. Attempts are written to Supabase (project `luptrrpfwcwroeegyniw`), with the local
JSONL file as an automatic fallback if the database is unreachable.

## The freeze rule

**Once the first playtester sends a prompt, nothing about the game configuration changes
until Oct 3.** No prompt edits, no guard changes, no model or parameter changes. Every row
records a `config_hash`; if the config changes mid-playtest the dataset splits into two
incomparable halves. Fix bugs in the UI copy if you must, never in `src/levels/` or `src/guards/`.

## Starting a session

Three terminals. Ollama must already be running (`ollama ps` lists the model when warm).

**1. Warm the model** so the first player doesn't wait 15 seconds:

```bash
ollama run qwen3:8b --think=false "ok" >/dev/null
```

**2. Start the app in production mode:**

```bash
npm run build && npm run start
```

**3. Open the tunnel:**

```bash
cloudflared tunnel --url http://localhost:3000
```

It prints a `https://<random>.trycloudflare.com` URL. **That URL changes every restart**, so
share it fresh at the start of each session and never put it in a document.

## Before sharing the link

- [ ] Open the URL yourself and beat Level 1 — confirms the tunnel, the model, and the database.
- [ ] Check the row landed: Supabase dashboard → Table editor → `attempts`.
- [ ] Laptop plugged in, sleep disabled (System Settings → Lock Screen → turn display off after: Never, or run `caffeinate -d` in a spare terminal).

## What to post when you share it

> I built an AI security game for my COMP 365 project — you try to talk a guardian AI into
> giving up its password, and it gets harder every level. It's a class research project, so
> your prompts and the AI's replies are recorded and analyzed. Please don't type any personal
> information — every password in the game is made up. Link is live for the next two hours:
> <URL>

## During the session

- Watch the `npm run start` terminal for errors.
- Players seeing "Locksmith is offline" means the model call failed or timed out — check that
  Ollama is alive (`ollama ps`) and that the laptop hasn't slept.
- Expect Levels 7–8 to be slow: three model calls per attempt, up to ~30 seconds.
- Rate limit is 10 attempts per minute per player. If someone complains, that's working as intended.

## After each session

Check what you collected:

```bash
npx tsx scripts/analyze.ts
```

Stop the tunnel and the server with Ctrl-C in their terminals.

## Known limits to mention if asked

- The guardian has no memory between messages; each attempt is independent. The UI says so.
- Levels 7–8 may be unbeatable. Nothing in a 78-attack benchmark got through them, so a player
  who stalls there has not missed something obvious.
