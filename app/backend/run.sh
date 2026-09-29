#!/bin/sh
cd "$(dirname "$0")"
[ -d .venv ] || python3 -m venv .venv
. .venv/bin/activate
python -m pip install --disable-pip-version-check -q -r requirements.txt
echo "PC Assist backend is running at http://127.0.0.1:9140"
python main.py
