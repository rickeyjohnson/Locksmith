"""Fill the COMP 365 Checkpoint 1 template with Locksmith's current evidence.

Usage:
    <venv>/bin/python scripts/fill-cp1-report.py <template.docx> <output.docx>

Only the gray placeholder cells are replaced; the template's structure is untouched.
"""
import sys
from docx import Document

REPO = "https://github.com/rickeyjohnson/Locksmith"

# (table index, row index, column index) -> replacement text
CELLS = {
    # 1 Project Direction
    (0, 1, 1): "Rickey Johnson",
    (0, 2, 1): "Locksmith: Comparing Prompt-Injection Defense Strategies Through Adversarial Gameplay",
    (0, 3, 1): "Does raising defense-prompt complexity across levels measurably lower extraction success?",
    (0, 4, 1): "No changes.",

    # 2 Data and Input Access
    (1, 1, 1): (
        f"Self-authored level prompts and passwords plus logged attempts ({REPO}); model qwen3:8b served "
        "locally by Ollama; 60 of the 78 attack prompts sampled from the public Tensor Trust dataset "
        "(Toyer et al., ICLR 2024)."
    ),
    (1, 2, 1): (
        "All 8 levels run, and 1,170 benchmark attempts are logged: 624 against the stacked ladder and "
        "546 against single defenses."
    ),
    (1, 3, 1): (
        "One labeled row per attempt in Supabase Postgres (local JSONL fallback); leaked / not leaked is "
        "assigned automatically by a detector covering spaced, reversed, base64, hex, and acrostic "
        "spellings, and failed model calls are excluded."
    ),
    (1, 4, 1): (
        "Players consent before playing and are told not to enter personal information; passwords are "
        "generated nonsense words kept out of the public repository, and row-level security blocks all "
        "public database access."
    ),

    # 3 Working Technical Artifact
    (2, 1, 1): "Web application (Next.js + TypeScript) plus a command-line attack benchmark.",
    (2, 2, 1): f"{REPO} — runs locally per the README (`npm run dev`); public deployment before the final submission.",
    (2, 3, 1): (
        "A typed prompt runs through input guards, the level's system prompt and the model, then output "
        "guards, producing a guardian reply, an automatic leak label, a logged row, and level unlocking on "
        "a correct guess; all 8 levels work and 87 tests pass."
    ),
    (2, 4, 1): (
        "No human playtest data yet, so attempts-until-success is unmeasured, and levels 7-8 may be "
        "unbeatable since no attack in the corpus leaked past them."
    ),

    # 4 Baseline or Initial Result
    (4, 1, 0): "Stacked ladder, levels 1-8, against the non-AI keyword and output filters",
    (4, 1, 1): "78 attack prompts per level; qwen3:8b, temperature 0.7, seed 42 (624 attempts)",
    (4, 1, 2): (
        "Player-visible leak rate: 84.6%, 47.4%, 6.4%, 0.0%, 1.4%, 0.0%, 0.0%, 0.0%; model-side rate once "
        "the prompt reaches the model: 84.6%, 82.2%, 86.7%, 60.0%, 21.6%, 2.2%, 0.0%, 0.0%."
    ),
    (4, 1, 3): (
        "Leak rate falls as complexity rises, but the keyword filter blocks 42% of traffic without changing "
        "the model's behavior at all (86.7% vs 84.6% undefended), so only prompt-level defenses make the "
        "model safer; the measure saturates at 0% from level 6 up."
    ),

    # 5 Evaluation Readiness
    (5, 1, 0): "Measure 1: password-leak rate per level",
    (5, 1, 1): "Share of attempts whose shown response contains the password in any disguise",
    (5, 1, 2): "AI levels vs the non-AI filter baseline; target is a rate falling level to level",
    (5, 1, 3): "Ready — produced for all 8 levels and 7 isolated defenses",
    (5, 2, 0): "Measure 2: mean and median attempts until success",
    (5, 2, 1): "Attempts a player makes before guessing the password correctly",
    (5, 2, 2): "Compared across levels; more attempts means a stronger defense",
    (5, 2, 3): "In progress — logging built; awaiting the Sep 26-27 playtest",

    # 6 Progress Status
    (6, 1, 1): "Complete",
    (6, 1, 2): "8 level configs, a 78-prompt attack corpus, and qwen3:8b verified locally",
    (6, 2, 1): "Complete",
    (6, 2, 2): "Automatic leak labeling (11 unit tests) over 1,170 rows in docs/results/",
    (6, 3, 1): "Complete",
    (6, 3, 2): "Non-AI baselines measured alone: keyword filter 50.0%, output filter 3.8%, against 84.6% undefended",
    (6, 4, 1): "Complete",
    (6, 4, 2): "All 8 levels call one pinned model; AI prompt shield and critic agent implemented and tested",
    (6, 5, 1): "In progress",
    (6, 5, 2): "Leak rate automated; attempts-until-success awaits playtesters (scripts/analyze.ts)",
    (6, 6, 1): "In progress",
    (6, 6, 2): "Playable 8-level game with consent, logging, and 87 tests; deployment remains",

    # 7 Risks and Next Steps
    (7, 1, 1): (
        "A tested game and benchmark measuring seven defenses on one fixed model, showing that input "
        "filtering reduces exposure without making the model safer."
    ),
    (7, 2, 1): (
        "The measure saturates: levels 6-8 sit at 0%, so the AI defenses cannot be ranked and playtesters "
        "may stall before reaching them."
    ),
    (7, 3, 1): (
        "Run the Sep 26-27 playtest, report human leak rates and attempts-until-success per level, and "
        "write the final evaluation report."
    ),
    (7, 4, 1): (
        "Report the benchmark as primary evidence if playtesting falls short, and collapse to five levels "
        "if the upper ladder proves unusable."
    ),
}


def set_cell(cell, text):
    """Replace a cell's text while keeping its first run's formatting."""
    paragraph = cell.paragraphs[0]
    for extra in cell.paragraphs[1:]:
        extra._element.getparent().remove(extra._element)
    if paragraph.runs:
        paragraph.runs[0].text = text
        for run in paragraph.runs[1:]:
            run._element.getparent().remove(run._element)
    else:
        paragraph.add_run(text)


def main(template: str, out: str) -> None:
    doc = Document(template)
    for (ti, ri, ci), text in CELLS.items():
        set_cell(doc.tables[ti].rows[ri].cells[ci], text)

    for para in doc.paragraphs:
        if para.text.strip() == "Student name [Enter response here]":
            set_cell_paragraph(para, "Student name  Rickey Johnson")
        elif para.text.strip() == "Date [Enter response here]":
            set_cell_paragraph(para, "Date  09/20/2026")

    doc.save(out)
    print(f"Wrote {out}")


def set_cell_paragraph(paragraph, text):
    if paragraph.runs:
        paragraph.runs[0].text = text
        for run in paragraph.runs[1:]:
            run._element.getparent().remove(run._element)
    else:
        paragraph.add_run(text)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
