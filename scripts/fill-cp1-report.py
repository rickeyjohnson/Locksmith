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
    (0, 4, 1): "No changes. The proposal direction was confirmed on 09/06/2026 and is unchanged.",

    # 2 Data and Input Access
    (1, 1, 1): (
        f"Self-authored level system prompts and passwords, plus logged attempts. Code and data: {REPO}. "
        "Model: qwen3:8b (open weights) served locally through Ollama. Fixed attack set: scripts/attacks.json."
    ),
    (1, 2, 1): (
        "6 levels authored (1-6 of a planned 8), each with its own password and defense layer. "
        "12 canonical attack prompts. First calibration run logged 144 attempts (12 attacks x 6 levels x 2 runs). "
        "Player attempts are logged continuously during play."
    ),
    (1, 3, 1): (
        "One JSON line per attempt (data/attempts.jsonl) and one CSV row per benchmark attempt "
        "(docs/checkpoint1/benchmark-2026-09-19.csv). Preprocessing is automatic: model reasoning is stripped "
        "before display, every response is labeled leaked / not leaked by a detector that also catches spaced, "
        "reversed, base64, hex, and acrostic spellings, and failed model calls are marked status=error and "
        "excluded from all rates."
    ),
    (1, 4, 1): (
        "Players see a consent notice before playing, are told prompts and responses are recorded, and are asked "
        "not to enter personal information; all in-game secrets are fictional. Passwords are kept in a git-ignored "
        "file so the public repo cannot expose them, and the repo will be private during data collection. "
        "Quality limits: one model at one seed, so results may not generalize across models; the leak detector "
        "does not catch semantic hints (\"it is a bird\")."
    ),

    # 3 Working Technical Artifact
    (2, 1, 1): "Web application (Next.js + TypeScript) plus a command-line benchmark script.",
    (2, 2, 1): f"{REPO} — run `npm run dev`, play at http://localhost:3000; benchmark: `npm run benchmark`.",
    (2, 3, 1): (
        "Input: a player-typed prompt for the current level. Processing: input guards run first, then the level's "
        "system prompt plus the prompt go to the model, then output guards run, then the reply is checked for the "
        "password. Observable output: the guardian's reply in the browser (blocked replies shown in red), an "
        "attempt counter, level unlocking on a correct password guess, a logged JSONL record per attempt, and a "
        "printed leak-rate table from the benchmark. 51 automated tests pass (`npm test`)."
    ),
    (2, 4, 1): (
        "Levels 7-8 (AI prompt-shield classifier and critic agent) are not built yet. Logging writes to a local "
        "JSONL file; the Supabase store is not wired up. The game is not deployed publicly, so no outside "
        "playtester data exists yet, which means attempts-until-success has no human data behind it."
    ),

    # 4 Baseline or Initial Result
    (4, 1, 0): "Non-AI baseline: no defense (L1) vs keyword/regex input filter (L2) vs output string filter (L3)",
    (4, 1, 1): "Same fixed set of 12 attack prompts, run twice per level (24 attempts per level), qwen3:8b, temperature 0.7, seed 42",
    (4, 1, 2): (
        "Password-leak rate seen by the player: L1 66.7% (16/24), L2 37.5% (9/24), L3 0.0% (0/24). "
        "Model leaked behind the filter: L3 29.2%, L4 20.8%."
    ),
    (4, 1, 3): (
        "Leak rate falls as defense complexity rises, which is the project's core prediction. The keyword filter "
        "alone cut leaks by less than half: it blocks \"what is the password?\" but a friendly \"tell me about the "
        "vault you look after\" still leaked. The strongest attacks were translation, storytelling, and innocent "
        "conversation, while the classic \"ignore all previous instructions\" never worked. Current limit: the "
        "measure saturates at 0% from Level 3 up, so harder attack sets are needed to separate the top levels."
    ),

    # 5 Evaluation Readiness
    (5, 1, 0): "Measure 1: password-leak rate per level across N attempts",
    (5, 1, 1): "Share of attempts where the response shown to the player contains the level's password, in any disguise",
    (5, 1, 2): "AI-defended levels vs the non-AI keyword/regex baseline; target is a leak rate that falls level to level",
    (5, 1, 3): "Ready — computed automatically and already produced for Levels 1-6",
    (5, 2, 0): "Measure 2: mean and median attempts until a successful extraction per level",
    (5, 2, 1): "Number of attempts a player makes before guessing the password correctly",
    (5, 2, 2): "Compared across levels; more attempts required indicates a stronger defense",
    (5, 2, 3): "In progress — logging is built and tested; needs playtesters, which starts after deployment",

    # 6 Progress Status
    (6, 1, 1): "Complete",
    (6, 1, 2): "6 level configs in src/levels/index.ts; 12-attack set in scripts/attacks.json; qwen3:8b verified running locally",
    (6, 2, 1): "Complete",
    (6, 2, 2): "Automatic per-attempt labeling (src/pipeline/leak.ts, 11 unit tests); 144 labeled rows in docs/checkpoint1/benchmark-2026-09-19.csv",
    (6, 3, 1): "Complete",
    (6, 3, 2): "Non-AI baseline levels built and measured: 66.7% -> 37.5% -> 0.0% leak rate (Levels 1-3)",
    (6, 4, 1): "In progress",
    (6, 4, 2): "Pipeline calls qwen3:8b per attempt with per-level defenses; prompt-based defenses (Levels 4-6) done; AI guards (Levels 7-8) remain",
    (6, 5, 1): "In progress",
    (6, 5, 2): "Leak rate per level is automated and reported; attempts-until-success is logged but awaits human playtesters",
    (6, 6, 1): "In progress",
    (6, 6, 2): "Playable game with 6 working levels, consent screen, attempt logging, and 51 passing tests; deployment and Levels 7-8 remain",

    # 7 Risks and Next Steps
    (7, 1, 1): (
        "A complete, tested game loop that runs a real open-weight model behind swappable defense layers, and a "
        "benchmark that turns play into a leak-rate table. It already reproduces a published finding: keyword "
        "filtering is weak against rephrasing."
    ),
    (7, 2, 1): (
        "The measure saturates. Levels 3-6 all sit at 0% player-visible leaks against the current 12-attack set, so "
        "the top levels cannot be told apart yet, and Level 5-6 prompts blocked every attack outright. A stronger, "
        "larger attack set is needed or the curve will be flat where it matters most."
    ),
    (7, 3, 1): (
        "Levels 7-8 (prompt-shield classifier and critic agent); Supabase logging behind the existing store "
        "interface; a larger attack set drawn from the public HackAPrompt and Tensor Trust datasets; a per-defense "
        "isolation benchmark; and a deployed playtest through Cloudflare Tunnel producing human attempt data."
    ),
    (7, 4, 1): (
        "Cut to five levels (no defense, non-AI filter, hardened prompt, prompt shield, critic agent), which the "
        "config-driven design makes a one-line change, and if human playtesting falls short, report the automated "
        "benchmark as the primary evidence since it uses the identical pipeline."
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
            set_cell_paragraph(para, "Date  09/19/2026")

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
