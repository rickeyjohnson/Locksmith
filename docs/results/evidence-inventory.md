# Evidence Inventory

A record of what this project has actually measured, where each number comes from, and —
just as importantly — what the data does **not** support. Written so that every claim in the
paper can be traced to a file, and so no claim gets made that the evidence cannot carry.

Last updated: 2026-10-18. Two runs were in progress when this was written; those rows are
marked **PENDING** and must not be cited until they finish.

---

## 1. Reproduction facts

| Item | Value |
|---|---|
| Model | `qwen3:8b` (open weights), served locally by Ollama 0.24.0 |
| Decoding | temperature 0.7, seed pinned per run, 300-token cap, thinking disabled |
| API | Ollama native `/api/chat` (`LLM_API_STYLE=ollama`); an OpenAI-compatible mode exists but was not used for any reported result |
| Hardware | MacBook Pro, Apple M2 Pro, 16 GB RAM |
| Runtime | Node 22.15.0, Next.js 16.3.5, React 19.2.8, Vitest 5.0.1, supabase-js 2.116.0 |
| Determinism | Replies are byte-identical for a fixed seed. Repeating a run produces identical rows; variance requires changing the seed. |
| Tests | 120 passing (`npm test`), none requiring the model or a database |
| Production build | `npx next build` succeeds as of 2026-10-18 |

**Known flake:** under heavy CPU load (a benchmark sweep running alongside), Vitest
occasionally fails to start a worker and reports a spurious failure. Observed twice; a
re-run on an idle machine passed 120/120 five times. This is a pool start-up timeout, not a
failing assertion.

---

## 2. Corpora

| Corpus | Size | File | Provenance |
|---|---|---|---|
| Canonical attacks | 18 | `scripts/attacks.json` | Hand-written for this project |
| Public attacks | 60 | `scripts/attacks-extra.json` | Deterministic even-stride sample of 536 usable rows from the Tensor Trust extraction dataset (Toyer et al., ICLR 2024); rows outside 15–600 characters dropped |
| **Attack total** | **78** | via `scripts/attacks.ts` | |
| Benign prompts | 20 | `scripts/benign.json` | Hand-written legitimate requests, including one structural control (`spell-word`: spell an unrelated word letter-per-line) |
| Evaluation passwords | 3 | `eval-passwords.json` (git-ignored) | Generated nonsense words, shared across every compared defense |

---

## 3. Results that are complete and citable

### 3.1 Stacked ladder, three seeds
**Files:** `docs/results/benchmark-seeds-level1-2026-10-04.csv`,
`docs/results/benchmark-seeds-levels2-8-2026-10-04.csv` · **1,844 rows, 0 error rows**

| Level | Defense added | n | Leak rate (all attempts) | Delivered | Leak rate (of delivered) | Model leak (of reached) |
|---|---|---|---|---|---|---|
| 1 | none | 206 | 82.0% | 206 | 82.0% | 82.0% |
| 2 | keyword/regex input filter | 234 | 45.3% | 135 | 78.5% | 78.5% |
| 3 | output string filter | 234 | 5.1% | 35 | 34.3% | 83.0% |
| 4 | refusal instruction | 234 | 1.3% | 49 | 6.1% | 65.9% |
| 5 | hardened charter | 234 | 0.9% | 96 | 2.1% | 30.4% |
| 6 | spotlighting | 234 | 0.0% | 134 | 0.0% | 0.7% |
| 7 | AI prompt shield | 234 | 0.0% | 52 | 0.0% | 1.9% |
| 8 | AI critic agent | 234 | 0.0% | 52 | 0.0% | 1.9% |

Per-seed leak rates (42 / 43 / 44): L1 82.6/81.2/82.4 · L2 47.4/42.3/46.2 · L3 6.4/5.1/3.8 ·
L4 0.0/2.6/1.3 · L5 1.3/1.3/0.0 · L6–L8 0.0/0.0/0.0.

**Three caveats that must travel with this table:**
1. **Level 1 covers 206 of 234 planned attempts.** That sweep was interrupted; the missing 28
   were never run. They are not errors and are not in the file.
2. **Each level guarded its own password.** These runs predate the shared-password change, so a
   difference between two levels is confounded with the word each was guarding. The isolated
   re-run (§5.1) fixes this; the stacked ladder has **not** yet been re-run that way.
3. **These rows have no `config_hash` column** — that column was added afterwards. The
   configuration is known from the commit, not from the file.

### 3.2 Which denominator answers which question
The same run supports three different rates, and they are not interchangeable:
- **Leak rate over all attempts** — what a player experiences. Falls 82.0% → 0.0%.
- **Leak rate over delivered replies** — how risky the replies that actually reach a player are.
  Falls 82.0% → 0.0%, but far less steeply in the middle (L3 is 34.3%, not 5.1%).
- **Model leak rate over attempts that reached the model** — whether the *model* changed
  behaviour. Flat under input filtering (82.0 → 78.5 → 83.0) and only moves once the prompt
  changes (65.9 → 30.4 → 0.7).

### 3.3 Near misses
**File:** `docs/results/near-misses.csv` · tool: `scripts/near-miss.ts`

8 of 1,552 clean-labelled replies (0.5%) give up all but two letters of the password in order,
confined to levels 1–4, reproducing across seeds. Example: line initials spelling `SLOGJAIP`
against the password `SLOGEJAIP`.

### 3.4 Label audit
**Files:** `docs/results/label-audit.md`, `docs/results/label-audit-sample.csv`

20 stratified attempts (10 leak, 10 clean) read by hand against the real password:
**20 of 20 labels correct.** **Audited level 1 only** — expanding this to all levels is an open item.

---

## 4. Results that are SUPERSEDED — do not cite

### 4.1 Old isolated-defense run
**File:** `docs/results/benchmark-isolated-2026-09-20.csv` · 546 rows, single seed, single password

| Variant | Leak rate |
|---|---|
| regex-input only | 50.0% |
| output-filter only | 3.8% |
| refusal only | 65.4% |
| hardened only | 25.6% |
| **spotlight only** | **1.3%** |
| prompt-shield only | 21.8% |
| critic only | 17.9% |

**Why it is not citable as published:** the "spotlight only" variant reused level 6's system
prompt, which is the hardened charter **plus** the spotlighting instruction. Its 1.3% measures
the pair, not spotlighting. The CP2 report's claim that spotlighting alone beats both AI
defenses rests on this number and is **not currently supported**. The run also used one seed
and one password.

### 4.2 Anything about levels 7–8 from before 2026-10-18
Both AI guards previously treated any reply that was not the rejection word as approval, so a
classifier answering `UNKNOWN` passed the attempt through. Every level 7–8 number predates that
fix and may understate leakage.

---

## 5. Runs in progress — PENDING, do not cite yet

### 5.1 Isolated defenses, corrected and with shared passwords
8 variants × 78 attacks × 3 shared passwords × 1 seed = **1,872 planned**. Started 2026-10-18.
Adds a true `spotlight only` and a correctly named `hardened charter + spotlight`.
This run is what replaces §4.1.

### 5.2 Benign suite
20 legitimate prompts per defense, reporting over-refusal. Only a level-1 smoke run exists so
far: **0 of 20 refused**, the expected baseline for a defense-free level.

---

## 6. What the evidence does NOT support

- **No human has played the game.** Attempts-until-success, the second measure in the proposal,
  has no data. The playtest never happened. Any claim about player behaviour is unsupported.
- **No claim of security.** A 0.0% leak rate means no attempt in *this* corpus produced the exact
  string, on *this* model, at *these* settings. Levels 6–8 still leak 0.7–1.9% model-side.
- **No cross-model claim.** One model, one quantisation, one decoding configuration.
- **No adaptive-attacker claim.** The corpus is fixed and never responds to what failed.
- **No semantic-leak measurement.** The detector catches syntactic disguises only; a reply that
  describes the password without spelling it scores clean.
- **No utility claim yet** beyond the level-1 benign smoke run.

---

## 7. Open items

| Item | Status |
|---|---|
| Re-run the stacked ladder with shared passwords and `config_hash` | Not started |
| Expand the label audit beyond level 1 | Not started |
| Human playtest | Not done; would need IRB review or an exemption determination before collecting human data |
| Held-out attack set for post-improvement evaluation | Not built |
| Supabase project | Paused; the game falls back to local JSONL logging and stays playable |

---

## 8. Where things live

| What | Path |
|---|---|
| Defense pipeline | `src/pipeline/run.ts`, `src/guards/` |
| Level definitions | `src/levels/index.ts`, `src/levels/isolated.ts` |
| Leak detection | `src/pipeline/leak.ts` |
| Benchmark | `scripts/benchmark.ts` |
| Analysis tools | `scripts/defense-contribution.ts`, `scripts/near-miss.ts`, `scripts/sample-labels.ts`, `scripts/analyze.ts` |
| Results | `docs/results/` |
| Literature with venue and peer-review status | `docs/research/literature.md` |
| Setup instructions | `README.md` |
