#!/usr/bin/env python3
"""Strip CFR-style (Object) casts that break Java 8+ type checking."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src/main/java"

PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\(Object\)\(\(Object\)this\)"), "this"),
    (re.compile(r"\(Object\)\(\(Object\)([^)]+)\)"), r"\1"),
    (re.compile(r"\.add\(\(Object\)"), ".add("),
    (re.compile(r"\.addAll\(\(Object\[\]\)"), ".addAll("),
    (re.compile(r"\.setAll\(\(Object\[\]\)"), ".setAll("),
    (re.compile(r"\.remove\(\(Object\)"), ".remove("),
    (re.compile(r"\.contains\(\(Object\)"), ".contains("),
    (re.compile(r"\.getChildren\(\)\.add\(\(Object\)"), ".getChildren().add("),
    (re.compile(r"\.getScope\(\)\.add\(\(Object\)"), ".getScope().add("),
    (re.compile(r"new Image\(\(Object\)"), "new Image("),
    (re.compile(r"new Stage\(\(Object\)"), "new Stage("),
    (re.compile(r"Platform\.runLater\(\(Runnable\)\(Object\)"), "Platform.runLater((Runnable)"),
]


def main() -> None:
    changed = 0
    for path in ROOT.rglob("*.java"):
        text = path.read_text(encoding="utf-8")
        original = text
        for pattern, repl in PATTERNS:
            text = pattern.sub(repl, text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed += 1
    print(f"patched {changed} files")


if __name__ == "__main__":
    main()
