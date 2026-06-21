#!/bin/bash
set -e

PROJECT_DIR="$HOME/epads-intelligence/pipeline"
LOG_DIR="$PROJECT_DIR/logs"
LOGFILE="$LOG_DIR/pipeline_$(date +%Y%m%d_%H%M).log"

mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR"
source "$HOME/epads-intelligence/venv/bin/activate"

echo "=============================="
echo "Pipeline started: $(date)"
echo "=============================="

echo "--- Phase 1: Scrape tender list ---"
python scrapers/phase1_epads_list.py

echo "--- Phase 2: Scrape tender details ---"
python scrapers/phase2_epads_details.py

echo "--- Phase 3: Enrich with iframes/PDFs ---"
python scrapers/phase3_epads_iframes.py

echo "--- Transform & Load to Supabase ---"
python transform_and_load.py

echo "--- Send alert emails ---"
python alert_sender.py

echo "=============================="
echo "Pipeline complete: $(date)"
echo "=============================="