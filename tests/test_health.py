"""No server here (static_site, no backend) — 'health' is: the required files exist,
and the repo's own zero-dep structural check (scripts/check.mjs) passes."""
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_required_files_present():
    for name in ("index.html", "404.html", "robots.txt", "sitemap.xml", "app.json"):
        assert (ROOT / name).is_file(), f"missing {name}"


def test_structural_check_passes():
    if shutil.which("node") is None:
        return  # node not on this box; the file-presence test above still ran
    result = subprocess.run(
        ["node", "scripts/check.mjs"], cwd=ROOT, capture_output=True, text=True
    )
    assert result.returncode == 0, result.stdout + result.stderr
