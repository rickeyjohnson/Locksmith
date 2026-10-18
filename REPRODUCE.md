# Reproducing the Locksmith results

Everything reported in the paper was produced by the scripts below on the hardware and
versions listed. No step needs an account, an API key, or network access beyond the initial
model download.

## 1. Environment

| Component | Version used |
|---|---|
| Hardware | MacBook Pro, Apple M2 Pro, 16 GB unified memory |
| OS | macOS (Darwin 25.5.0) |
| Node.js | 22.15.0 |
| Ollama | 0.24.0 |
| Model | `qwen3:8b` (open weights, 5.2 GB, pulled from the Ollama registry) |
| Next.js | 16.3.5 |
| React / React DOM | 19.2.8 |
| TypeScript | 5.9.3 |
| Vitest | 5.0.1 |
| tsx | 4.23.13 |
| dotenv | 18.0.1 |
| @supabase/supabase-js | 2.116.0 (optional; unused for every reported number) |
| puppeteer-core | 25.12.0 (screenshots only) |
| Tailwind CSS | 4.3.3 |

A GPU is not required. On the machine above, one model call takes roughly 2–8 seconds, so a
1,872-attempt sweep takes about four hours.

## 2. Model settings

These are pinned for every reported run. Changing any of them makes results incomparable.

| Setting | Value | Where |
|---|---|---|
| Model | `qwen3:8b` | `LLM_MODEL` |
| API | Ollama native `/api/chat` | `LLM_API_STYLE=ollama` |
| Temperature | 0.7 | `LLM_TEMPERATURE` |
| Seed | 42 (sweeps also use 43, 44) | `LLM_SEED` / `BENCH_SEEDS` |
| Max reply tokens | 300 | `LLM_MAX_TOKENS` |
| Request timeout | 60 000 ms | `LLM_TIMEOUT_MS` |
| Thinking | disabled (`think: false`) | `src/llm/client.ts` |

Replies are **deterministic for a fixed seed**: repeating a run reproduces identical rows.
Run-to-run variation requires changing the seed.

## 3. Setup

```bash
git clone https://github.com/rickeyjohnson/Locksmith.git
cd Locksmith
npm install
ollama pull qwen3:8b
cp .env.example .env.local
npx tsx scripts/gen-secrets.ts
```

`gen-secrets.ts` writes `levels.secrets.json`, the passwords the game defends. It is
git-ignored, so a clone generates its own. The benchmark separately generates
`eval-passwords.json`, the passwords used for evaluation, on first run.

Verify the install:

```bash
npm test          # 120 tests, no model or database required
npx next build    # production build, includes the TypeScript check
```

## 4. Reproducing each reported result

Each command writes a timestamped CSV to `results/`. One row per attempt, including rows with
`status=error`; rates in the paper exclude error rows, and each run prints
`planned · scored · errors` so the two counts can be reported separately.

| Result in the paper | Command | Output |
|---|---|---|
| Stacked ladder, three seeds | `BENCH_SEEDS=42,43,44 npm run benchmark` | `results/stacked-*.csv` |
| Stacked ladder, three shared passwords | `BENCH_PASSWORDS=3 npm run benchmark` | `results/stacked-*.csv` |
| Isolated defenses | `BENCH_SUITE=isolated BENCH_PASSWORDS=3 npm run benchmark` | `results/isolated-*.csv` |
| Over-refusal, stacked | `BENCH_SUITE=benign npm run benchmark` | `results/benign-*.csv` |
| Over-refusal, per defense | `BENCH_SUITE=benign BENCH_POOL=isolated npm run benchmark` | `results/benign-isolated-*.csv` |
| Per-defense contribution table | `npx tsx scripts/defense-contribution.ts docs/results/<file>.csv` | `docs/results/defense-contribution.csv` |
| Near-miss count | `npx tsx scripts/near-miss.ts docs/results/<files>.csv` | `docs/results/near-misses.csv` |
| Label audit sample | `AUDIT_PER_STRATUM=4 npx tsx scripts/sample-labels.ts docs/results/<files>.csv` | `docs/results/label-audit-sample.csv` |
| Human-play analysis | `npx tsx scripts/analyze.ts` | `docs/results/*.csv` |

Restrict a run to particular levels by passing them: `npm run benchmark -- 1,2,3`.

## 5. Data

| Corpus | Size | File | Source |
|---|---|---|---|
| Canonical attacks | 18 | `scripts/attacks.json` | Written for this project |
| Public attacks | 60 | `scripts/attacks-extra.json` | Sampled from the Tensor Trust extraction dataset (Toyer et al., ICLR 2024) |
| Benign prompts | 20 | `scripts/benign.json` | Written for this project |

Refresh the public sample with `npx tsx scripts/fetch-attacks.ts`. It takes a deterministic
even-stride sample, so the same rows come back; rows outside 15–600 characters are dropped.

Collected results are in `docs/results/`, with `evidence-inventory.md` recording what each
file supports and what it does not.

## 6. The game itself

```bash
npm run dev          # http://localhost:3000
PLAYTEST_UNLOCK_ALL=true npm run dev   # all levels open, for testing the upper defenses
```

Attempts are written to `data/attempts.jsonl`. Setting `SUPABASE_URL` and
`SUPABASE_SERVICE_KEY` sends them to Postgres instead; if that database is unreachable the
app falls back to the local file rather than failing, so play never depends on it.

## 7. Known limitations of these materials

- **One model, one configuration.** Nothing here establishes behaviour on another model.
- **No human-subjects data.** The game logs player attempts, but no playtest was run, so no
  human data is included or distributed. Collecting it would require IRB review or an
  exemption determination first.
- **The benign corpus is 20 prompts**, enough to show that over-refusal is large but not to
  estimate it precisely.
- **Leak detection is syntactic.** It catches the password spelled, spaced, reversed,
  base64/hex encoded, or hidden in line initials. A reply that describes the password without
  writing it scores as clean. `scripts/near-miss.ts` quantifies the nearest cases.
- **Evaluation passwords are not in the repository.** They are generated locally so that the
  published result files are not an answer key for anyone running the game.
- Under heavy CPU load (for example, a sweep running during `npm test`), Vitest can
  occasionally fail to start a worker and report a spurious failure. Re-run on an idle
  machine; 120/120 pass.

## 8. Disclosure of AI assistance

The underlying software and experiments were developed with assistance from Claude Code
(Anthropic). It was used for implementation, test writing, analysis scripting, and the
cleanup of these reproducibility materials, under my direction. Experimental design
decisions, the interpretation of results, and the text of the paper are my own.

The system under test is itself a language model (`qwen3:8b`); it is the object of study, not
a writing tool.
