#!/usr/bin/env python3
"""Fix common CFR decompiler artifacts in laspoly sources."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src/main/java"

REPLACEMENTS: list[tuple[str, str]] = [
    ("import com.sun.javafx.scene.control.skin.ListViewSkin;", "import javafx.scene.control.skin.ListViewSkin;"),
    ("Objectrow.getItem()", "row.getItem()"),
    ("keyCodeArray[0]", "code[0]"),
    ("((Integer)final_.value())", "counter.value()"),
    ("final_", "counter"),
    ("for (Object lbl : (Object)labelsFromInterest)", "for (int lbl : labelsFromInterest"),
    ("blArray[0]", "evenlyBuilt[0]"),
    ("blArray2[0]", "propHasFactory[0]"),
    ("nArray[0]", "counter[0]"),
    ("nArray[0] = temp[0]", "temp[0] = temp[0]"),  # fixed below with regex
    ("this.chat.scrollTo((Object)message)", "this.chat.scrollTo(message)"),
    ("(KeySettings.KeyAction)((Object)row.getItem())", "(KeySettings.KeyAction) row.getItem()"),
]

# nArray in BroadcastTransactionActionCard uses temp
TEMP_FIXES = {
    "BroadcastTransactionActionCard.java": [("nArray[0] = temp[0] + this.val", "temp[0] = temp[0] + this.val")],
}

CAST_PATTERNS = [
    (re.compile(r"\(Object\)([a-zA-Z_][\w.]*)"), r"\1"),
    (re.compile(r"\.select\(\(Object\)"), ".select("),
    (re.compile(r"\.addListener\(\(Object\)"), ".addListener("),
]


def main() -> None:
    changed = 0
    for path in ROOT.rglob("*.java"):
        text = path.read_text(encoding="utf-8")
        original = text
        for old, new in REPLACEMENTS:
            text = text.replace(old, new)
        for old, new in TEMP_FIXES.get(path.name, []):
            text = text.replace(old, new)
        if path.name == "FieldGroup.java":
            text = text.replace("nArray[0] = counter[0] + 1", "counter[0] = counter[0] + 1")
        if path.name == "GameLobbyController.java":
            text = text.replace(
                "            this.flow.recreateCells();",
                "            getSkinnable().refresh();",
            )
        for pattern, repl in CAST_PATTERNS:
            text = pattern.sub(repl, text)
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed += 1
    print(f"patched {changed} files")


if __name__ == "__main__":
    main()
