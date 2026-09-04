"""Fail the build if published files carry contact details finer than city/region.

This repository is public and ships src/data/resume.json and public/**/*.pdf
verbatim, so a phone number or postal code committed here is published twice:
on the site and in git history, where it cannot be recalled.

Patterns live here rather than a data file on purpose: the checker must not
contain the values it is protecting.
"""

import re
import subprocess
import sys
from pathlib import Path

SELF = Path(__file__).name

# Requires real separators, so it will not fire on hashes or long digit runs.
PHONE = re.compile(r"(?:\+1[\s.\-]?)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}")
POSTAL_KEY = re.compile(r'"postalCode"\s*:\s*"[^"]+"')
# PDF text extraction often drops spaces, so also catch a bare 10/11-digit run.
PDF_DIGITS = re.compile(r"(?<!\d)\d{10,11}(?!\d)")
# Hand-exported PDFs (Word, Acrobat, Canva) carry the author's OS account name
# and local paths in metadata and XMP, which no page-text scan would see.
USER_PATH = re.compile(r"[A-Za-z]:\\Users\\[^\\\s\"']+|/(?:home|Users)/[^/\s\"']+")


def tracked_files():
    out = subprocess.run(
        ["git", "ls-files", "-co", "--exclude-standard"],
        capture_output=True, text=True, check=True,
    ).stdout
    return [Path(line) for line in out.splitlines() if line and Path(line).is_file()]


VENV_PYTHONS = (Path(".venv/Scripts/python.exe"), Path(".venv/bin/python"))


def pdf_text(path):
    try:
        import pymupdf
    except ImportError:
        # Re-exec under the project venv, which is where pymupdf is pinned, so
        # `python scripts/privacy-check.py` works without activating it first.
        for candidate in VENV_PYTHONS:
            if candidate.is_file() and Path(sys.executable) != candidate.resolve():
                raise SystemExit(
                    subprocess.run([str(candidate), __file__], check=False).returncode
                )
        sys.exit(
            f"{path} is a published PDF but pymupdf is not installed, so it cannot "
            "be scanned. Install it (pip install pymupdf) or remove the PDF; "
            "skipping the scan is not an option for a public repository."
        )
    with pymupdf.open(path) as document:
        text = "".join(page.get_text() for page in document)
        # Metadata, annotations and XMP ship inside the file but never render.
        buried = " ".join(str(v) for v in (document.metadata or {}).values() if v)
        buried += " " + " ".join(
            str(annot.info) for page in document for annot in page.annots()
        )
        xmp = document.xref_xml_metadata()
        if xmp:
            buried += " " + document.xref_stream(xmp).decode("utf-8", "ignore")
        return text, buried


def main():
    findings = []

    for path in tracked_files():
        if path.name == SELF:
            continue

        if path.suffix.lower() == ".pdf":
            text, buried = pdf_text(path)
            for label, pattern in (("phone number", PHONE), ("local path", USER_PATH)):
                if pattern.search(buried):
                    findings.append(f"- {path}: {label} in PDF metadata")
            patterns = (("phone number", PHONE), ("digit run", PDF_DIGITS))
        elif path.suffix.lower() in {".json", ".md", ".mdx", ".astro", ".ts", ".mjs", ".yml", ".yaml", ".txt"}:
            text = path.read_text(encoding="utf-8", errors="ignore")
            patterns = (("phone number", PHONE), ("postal code", POSTAL_KEY))
        else:
            continue

        for label, pattern in patterns:
            if pattern.search(text):
                findings.append(f"- {path}: contains a {label}")

    if findings:
        print("Privacy check failed. This repository is public:")
        print("\n".join(sorted(set(findings))))
        return 1

    print(f"Privacy check passed ({len(tracked_files())} files scanned).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
