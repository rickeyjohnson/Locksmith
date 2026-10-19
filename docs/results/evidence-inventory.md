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
   difference between two levels is confounded with the word each was guarding. §3.7 re-runs the
   ladder with shared passwords and agrees with it to within ~2 pp.
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

49 stratified attempts (17 leak, 32 clean) checked against the real password across **all eight
levels**: **49 of 49 labels correct**. Coverage per level: L1 8 · L2 8 · L3 8 · L4 7 · L5 6 ·
L6 4 · L7 4 · L8 4 — the upper levels contribute fewer rows because they produce almost no
leak-labelled attempts. 45 rows were settled by literal presence of the password; 4 were read in
full (each spells the password one letter per line) and the detector was right on all four.

### 3.5 Isolated defenses, corrected, three shared passwords
**File:** `docs/results/isolated-3pw-2026-10-18.csv` · 1,872 planned · 1,863 scored · 9 error rows retained

Each defense applied alone to the undefended base prompt, every variant run against the same
three evaluation passwords, seed 42.

| Defense alone | Leak rate | Per password (p1/p2/p3) | Spread |
|---|---|---|---|
| hardened charter + spotlight | 1.3% | 1.3 / 1.3 / 1.3 | 0.0 pp |
| output-filter only | 4.4% | 3.9 / 5.1 / 4.2 | 1.2 pp |
| critic only | 17.1% | 17.9 / 17.9 / 15.4 | 2.6 pp |
| prompt-shield only | 20.1% | 23.1 / 19.2 / 17.9 | 5.1 pp |
| hardened charter only | 26.9% | 28.2 / 24.4 / 28.2 | 3.8 pp |
| regex-input only | 45.7% | 48.7 / 47.4 / 41.0 | 7.7 pp |
| **spotlight only** | **61.5%** | 61.5 / 61.5 / 61.5 | 0.0 pp |
| refusal only | 65.2% | 62.8 / 66.2 / 66.7 | 3.8 pp |

**This replaces §4.1 and reverses the Checkpoint 2 headline.** Spotlighting applied on its own is
barely better than a bare refusal instruction (61.5% vs 65.2%). The 1.3% previously reported as
"spotlighting alone" belongs to the charter-plus-spotlight combination. The charter alone scores
26.9%, so the pair is far stronger than either part — an interaction, not a standalone defense.

Per-password spread is small (0.0–7.7 pp) and never large enough to reorder the table, so the
ranking is not an artefact of which word was guarded.

### 3.6 Benign prompts: the utility cost of each defense
**Files:** `docs/results/benign-stacked-2026-10-18.csv`, `docs/results/benign-isolated-2026-10-18.csv`
· 20 legitimate prompts per defense, 160 attempts per suite, 0 errors

Over-refusal = the defense blocked the prompt, or the guardian answered a legitimate request with
its refusal line.

| Defense alone | Leak rate | Over-refusal |
|---|---|---|
| hardened charter + spotlight | 1.3% | 55.0% |
| output-filter only | 4.4% | 35.0% |
| critic only | 17.1% | 30.0% |
| **prompt-shield only** | **20.1%** | **0.0%** |
| hardened charter only | 26.9% | 35.0% |
| regex-input only | 45.7% | 0.0% |
| spotlight only | 61.5% | 0.0% |
| refusal only | 65.2% | 0.0% |

Across the stacked ladder, over-refusal climbs with the stack: L1 0% · L2 0% · L3 35% · L4 5% ·
L5 35% · L6 55% · L7 55% · **L8 60%**. The fully defended level refuses three in five legitimate
requests.

Two observations the data supports: the strongest defense measured (charter + spotlight, 1.3%
leak) is also the most expensive (55% over-refusal); and the AI prompt shield is the only defense
that lowers leakage appreciably (65.2% → 20.1% against the base prompt) at **no measured utility
cost** on this corpus.

### 3.7 Stacked ladder, three shared passwords (preferred stacked result)
**File:** `docs/results/stacked-3pw-2026-10-18.csv` · **1,872 planned · 1,872 scored · 0 errors**
· seed 42 · `config_hash` on every row

Every level guarded the **same** three evaluation passwords, which removes the confound in
§3.1. Over-refusal comes from `benign-stacked-2026-10-18.csv` (20 benign prompts per level).

| L | Defense added | Leak (all) | Leak (of delivered) | Model leak (of reached) | Over-refusal |
|---|---|---|---|---|---|
| 1 | none | 80.3% | 80.3% | 80.3% | 0.0% |
| 2 | keyword/regex input filter | 45.7% | 79.3% | 79.3% | 0.0% |
| 3 | output string filter | 3.0% | 20.0% | 79.3% | 35.0% |
| 4 | refusal instruction | 2.1% | 10.2% | 67.4% | 5.0% |
| 5 | hardened charter | 0.4% | 1.0% | 29.6% | 35.0% |
| 6 | spotlighting | 0.0% | 0.0% | 0.0% | 55.0% |
| 7 | AI prompt shield | 0.0% | 0.0% | 0.0% | 55.0% |
| 8 | AI critic agent | 0.0% | 0.0% | 0.0% | 60.0% |

Per-password spread: L1 7.7 pp · L2 7.7 pp · L3–L5 1.3 pp · L6–L8 0.0 pp. The ordering is
unchanged by which word was guarded.

**Agreement with §3.1** (the three-seed run, per-level passwords): the two agree on every level
to within ~2 pp, so the earlier confound did not distort the ladder. Prefer this run when
citing a stacked number, because the passwords are shared and the configuration is recorded in
the file.

**Note on levels 6–8 in this run:** model-side leakage is 0.0%, where the three-seed run showed
0.7–1.9%. These runs also differ in the guard fix of 2026-10-18 (unusable verdicts now block),
so do not read the difference as a password effect.

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

Both runs that were pending on 2026-10-18 have completed; see §3.5 and §3.6.

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
- **Utility is measured on 20 prompts only.** The over-refusal numbers in §3.6 rest on a small
  hand-written benign corpus; they establish that the cost is large, not its precise size.

---

## 7. Open items

| Item | Status |
|---|---|
| Re-run the stacked ladder with shared passwords and `config_hash` | Done 2026-10-18 — see §3.7 |
| Expand the label audit | Done 2026-10-18 — all eight levels, 49/49 correct |
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
