# Material index: which verified facts answer which requirement

This is a filing system, not an outline. For each section, it lists the requirements **the
assignment states** and, beside each, the facts you have that could answer it, with the file
that proves each one.

**It deliberately does not tell you**: what your thesis is, which finding leads, what order
things go in, where emphasis falls, or what to cut. Those are the writing, and they're yours.

**A hard constraint that forces choices:** ICSE SRC is **2 pages including tables, plus one
page for references**. Everything below will not fit. Most of your work will go unmentioned.
Deciding what survives is the main authorial act of a short paper.

---

## Introduction — what the brief requires

| Required | Facts you have | Source |
|---|---|---|
| Background and reason | Secrets are routinely placed in system prompts; prompt injection extracts them; developers using a hosted model can only defend with prompts and filters | `docs/research/literature.md` §1 |
| Research question stated clearly | Your stated question: does raising defense-prompt complexity across levels measurably lower extraction success? | proposal, both checkpoints |
| Approach | Eight levels, each adding one defense; one shared pipeline; automated benchmark over a fixed corpus | `docs/how-it-works.md` Parts 2–3 |
| What you built | Playable 8-level web game; composable guard pipeline; leak detector; three benchmark suites; five analysis scripts; 120 automated tests | repo; `README.md` |
| Your specific contributions | The controlled comparison itself: seven defenses, one model, one corpus, shared passwords; the separation of player-visible from model-side leakage; the over-refusal measurement; the hand-checked labels | `docs/results/evidence-inventory.md` |
| The AI/ML task addressed | Prompt-injection resistance of an instruction-following LLM; secondary task is automatic leak detection in generated text | — |
| Separation of your work from tools you used | You did not train or fine-tune anything. qwen3:8b is pretrained and used as-is through Ollama. The defenses, pipeline, corpora, detector, harness and analysis are yours. Spotlighting is a published technique you implemented, not invented. | `README.md`, `docs/research/literature.md` |

---

## Related Work — what the brief requires

| Required | Facts you have | Source |
|---|---|---|
| Similar work | Tensor Trust (ICLR 2024) and Gandalf (preprint) — both gamified prompt-injection collection | `docs/research/literature.md` §3 |
| Different approaches | StruQ (USENIX Security 2025), SecAlign (ACM CCS 2025), DataSentinel (IEEE S&P 2025) — all defend by changing the model or its interface, not the prompt | §0.1 |
| Conflicting findings | Hines et al. report spotlighting dropping attack success from >50% to <2% on GPT-family models. **You measure 61.5% for spotlighting alone on qwen3:8b.** A direct conflict worth stating as such. | §2 vs `isolated-3pw-2026-10-18.csv` |
| Peer-reviewed vs preprint | Verified table of venues: ICLR/USENIX/EMNLP/AISec/CCS/S&P peer-reviewed; spotlighting, Gandalf, instruction-hierarchy, CaMeL are preprints | `docs/research/literature.md` §0 |
| The gap you address | Prompt-level defenses are rarely compared against each other on one model with one corpus; the strongest one you measured has not been peer reviewed | §0 |
| Citations you have read | 12 entries in `paper/references.bib` | **You must read each before citing it** |

---

## Methodology — what the brief requires

| Required | Facts you have | Source |
|---|---|---|
| Data sources | 18 self-written attacks; 60 sampled from the public Tensor Trust extraction dataset; 20 self-written benign prompts; generated nonsense-word passwords | `scripts/*.json` |
| Cleaning / preprocessing | Dataset rows outside 15–600 characters dropped (536 usable → 60 by even stride); model reasoning stripped from replies before scoring | `scripts/fetch-attacks.ts`, `src/llm/client.ts` |
| Models and algorithms, and why | qwen3:8b, open weights, runs locally so the model is fixed and free; same model also serves as the shield classifier and the critic | `README.md` |
| Pretrained vs from scratch | Pretrained, used as-is. **No training or fine-tuning was performed.** | — |
| Evaluation process | Each prompt run against each defense; one CSV row per attempt; error rows retained and excluded from rates | `scripts/benchmark.ts` |
| Baseline | Two non-AI baselines: keyword/regex input filter and literal output filter; plus the undefended level as a floor | `src/guards/` |
| Three comparisons under the same conditions | Eight stacked levels and eight isolated variants, all sharing model, parameters, corpus and passwords | `docs/results/isolated-3pw-2026-10-18.csv` |
| Metrics | Player-visible leak rate; model-side leak rate; over-refusal rate on benign prompts; the three denominators and what each answers | `docs/how-it-works.md` Parts 4–5 |
| Credit for outside code and AI tools | Ollama, Next.js, Supabase, Tensor Trust dataset; spotlighting follows Hines et al.; development assisted by Claude Code under your direction | `README.md` disclosure section |
| Hardware and settings | M2 Pro, 16 GB; temperature 0.7; seeds 42/43/44; 300-token cap; 60s timeout; thinking disabled | `README.md` |
| Which parts are implemented | All 8 levels, both AI guards, 3 suites, 5 analysis scripts, 120 tests, production build passing | — |
| Methodological limitations | One model; static corpus; syntactic leak detection; 20 benign prompts only; stacked runs used per-level passwords | `evidence-inventory.md` §6 |
| IRB | **No human-subjects data was collected.** The playtest never ran. Collecting it would require review or an exemption determination first. | `evidence-inventory.md` §7 |

---

## Results — what the brief requires

| Required | Facts you have | Source |
|---|---|---|
| Measured results using your metrics | Stacked: 82.0 → 45.3 → 5.1 → 1.3 → 0.9 → 0.0 → 0.0 → 0.0% | `benchmark-seeds-*.csv` |
| | Isolated: refusal 65.2, spotlight 61.5, regex 45.7, charter 26.9, shield 20.1, critic 17.1, output filter 4.4, charter+spotlight 1.3% | `isolated-3pw-2026-10-18.csv` |
| | Over-refusal: charter+spotlight 55%, charter 35%, output filter 35%, critic 30%, shield 0%, regex 0%, spotlight 0%; stacked rises to 60% at L8 | `benign-*.csv` |
| | Model-side given reached: 82.0 → 78.5 → 83.0 → 65.9 → 30.4 → 0.7 → 1.9 → 1.9% | `benchmark-seeds-*.csv` |
| Baseline comparison | Non-AI baselines vs AI defenses vs prompt defenses, same corpus and passwords | both tables in `paper/main.tex` |
| Case counts | 1,844 stacked (3 seeds); 1,872 planned / 1,863 scored / 9 errors isolated; 320 benign | `evidence-inventory.md` |
| Tables that stand alone | Two tables already in `paper/main.tex`; **captions are yours to write** | — |
| Variance | Per-seed and per-password spreads; per-password spread 0.0–7.7 pp, never reorders the ranking | §3.5 |
| Nothing planned presented as done | No human-play results exist; attempts-until-success has no data | — |

---

## Discussion — what the brief requires

| Required | Facts you have | Source |
|---|---|---|
| What results mean for the question | Complexity does lower player-visible extraction (82.0% → 0.0%), but not uniformly by mechanism: input filtering leaves model behaviour unchanged (82.0 / 78.5 / 83.0) | §3.1–3.2 |
| An actual failure or weak result | Three candidates, all real: (a) spotlighting alone 61.5%, contradicting both your CP2 claim and the published figure; (b) over-refusal of 55–60% at the strong end; (c) 8 near misses where the model spells all but two letters of the password | §3.5, §3.6, `near-misses.csv` |
| Likely cause | Mislabelled variant (the charter was included); defenses that refuse broadly cannot distinguish attack from question; the leak measure is syntactic and binary | `label-audit.md` |
| How it could be addressed | Isolate variants by construction and test the isolation; measure utility alongside security on every defense; score partial recovery rather than exact-string presence | — |
| Tested vs proposed | **Tested:** the isolation fix (re-ran, numbers reversed) and the benign measurement (ran, 320 attempts). **Proposed:** partial-recovery scoring, adaptive attacks, human play. | — |
| Broader impact | A developer who cannot retrain a model gets a measured trade-off, including that the cheapest-looking defense is weak alone and the strongest refuses most legitimate traffic | — |
| Specific next steps | Human study under IRB; adaptive attacks reserved as held-out evaluation; cross-model replication; semantic leak detection | `evidence-inventory.md` §7 |

---

## Things that would be false if you wrote them

Check your draft against this list before submitting.

- "Spotlighting is the strongest defense" — **false**, that was the mislabelled variant (CP2).
- "Levels 6–8 are secure" — **unsupported**; they leak 0.7–1.9% model-side and no human tried them.
- "Players took N attempts" — **no human data exists**.
- "The defenses generalize" — **one model, one quantisation, one corpus**.
- "The leak rate is X" without saying which denominator — **ambiguous between three answers**.
- "1,872 attempts were analysed" — **1,872 planned, 1,863 scored, 9 errors**.
