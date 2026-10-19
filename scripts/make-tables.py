"""Regenerates the LaTeX result tables from the measured CSVs.

    python3 scripts/make-tables.py

Prints the tables to stdout. Paste them into paper/main.tex, replacing the previous
pair, if the underlying runs change. Captions are intentionally left as TODO: they are
prose and belong to the author.
"""
import csv


def rows(path):
    return [r for r in csv.DictReader(open(path)) if r["status"] != "error"]


def main():
    iso = rows("docs/results/isolated-3pw-2026-10-18.csv")
    ben = rows("docs/results/benign-isolated-2026-10-18.csv")
    names = list(dict.fromkeys(r["level_name"] for r in iso))

    def leak_of(name):
        g = [r for r in iso if r["level_name"] == name]
        return sum(r["leaked"] == "true" for r in g) / len(g) * 100

    out = [
        r"\begin{table}[t]",
        r"\caption{TODO: write your own caption.}",
        r"\label{tab:isolated}",
        r"\centering",
        r"\begin{tabular}{lrrr}",
        r"\hline",
        r"Defense (applied alone) & Leak rate & Over-refusal & $n$ \\",
        r"\hline",
    ]
    for n in sorted(names, key=leak_of):
        a = [r for r in iso if r["level_name"] == n]
        b = [r for r in ben if r["level_name"] == n]
        ref = sum(r["refused"] == "true" for r in b) / len(b) * 100 if b else float("nan")
        out.append(f"{n.replace('&', chr(92) + '&')} & {leak_of(n):.1f}\\% & {ref:.1f}\\% & {len(a)} \\\\")
    out += [r"\hline", r"\end{tabular}", r"\end{table}"]
    print("\n".join(out))


if __name__ == "__main__":
    main()
