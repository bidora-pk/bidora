"""
transform_and_load.py
Reads 3_tenders_final.csv + 1_tenders_list.csv, merges them,
classifies industries, parses deadlines, and upserts to Supabase.
Run after Phase 3 completes.
"""
import csv
import os
import re
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

BASE = os.path.dirname(__file__)
LIST_CSV  = os.path.join(BASE, "data/1_tenders_list.csv")
FINAL_CSV = os.path.join(BASE, "data/3_tenders_final.csv")

# ── Industry classification rules ────────────────────────────────────────────
INDUSTRY_RULES = [
    ("IT & Tech",              ["software","hardware","network","laptop","server","computer","digital","it services","cybersecurity","telecom","fiber","data center","application","database","ict","technology"]),
    ("Electrical & Power",     ["electric","power","transformer","cable","generator","solar","inverter","ups","wiring","switchgear","substation","voltage","panel","battery"]),
    ("Construction & Civil Works",["road","building","bridge","cement","construction","civil","infrastructure","pavement","renovation","repairing","tiling","flooring","drainage","sewerage"]),
    ("Vehicles & Transport",   ["vehicle","transport","fleet","bus","truck","car","ambulance","motorcycle","trailer","crane","machinery"]),
    ("Medical & Health",       ["medicine","hospital","surgical","drug","medical","pharmaceutical","health","equipment","ambulance","lab","clinical","vaccine"]),
    ("Office & General Supplies",["stationery","furniture","office","printing","publication","book","form","toner","cartridge","paper","chair","desk"]),
    ("Professional Services",  ["consultancy","audit","training","survey","inspection","legal","advisory","research","management","security guard","cleaning","pest"]),
    ("Industrial & Hardware",  ["fabrication","welding","steel","pipe","valve","pump","fitting","industrial","mechanical","tooling","spare parts","compressor"]),
    ("Food & Catering",        ["food","catering","ration","provision","mess","canteen","kitchen","cooking"]),
]

def classify(title: str, description: str) -> str:
    text = f"{title} {description}".lower()
    for category, keywords in INDUSTRY_RULES:
        if any(kw in text for kw in keywords):
            return category
    return "Uncategorized"

def parse_ending_date(time_left_str: str) -> str | None:
    """
    Converts EPADS time strings to ISO datetime.
    Handles: 'Jun 22, 2026 03:00 PM' and '11h 31m Left' and '3 Days 4h 12m Left'
    """
    s = str(time_left_str).strip()
    # Absolute date format: 'Jun 22, 2026 03:00 PM'
    try:
        dt = datetime.strptime(s, "%b %d, %Y %I:%M %p")
        return dt.isoformat()
    except ValueError:
        pass
    # Relative: calculate from now
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    days  = int(m.group(1)) if (m := re.search(r'(\d+)\s*Day', s, re.I)) else 0
    hours = int(m.group(1)) if (m := re.search(r'(\d+)h', s, re.I)) else 0
    mins  = int(m.group(1)) if (m := re.search(r'(\d+)m', s, re.I)) else 0
    if days or hours or mins:
        from datetime import timedelta
        deadline = now + timedelta(days=days, hours=hours, minutes=mins)
        return deadline.isoformat()
    return None

def load_phase1():
    data = {}
    if not os.path.exists(LIST_CSV):
        return data
    with open(LIST_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("Tender_ID"):
                data[row["Tender_ID"]] = row
    return data

def load_phase3():
    data = {}
    if not os.path.exists(FINAL_CSV):
        return data
    with open(FINAL_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("Tender_ID"):
                data[row["Tender_ID"]] = row
    return data

def run():
    print("Loading CSVs...")
    phase1 = load_phase1()
    phase3 = load_phase3()

    all_ids = set(phase1.keys()) | set(phase3.keys())
    records = []

    for tid in all_ids:
        p1 = phase1.get(tid, {})
        p3 = phase3.get(tid, {})

        title       = p1.get("Title", p3.get("Title", ""))
        description = p3.get("Description", "")
        time_left   = p1.get("Time_Left", "")

        record = {
            "tender_id":              tid,
            "title":                  title,
            "industry_category":      classify(title, description),
            "procuring_agency":       p1.get("Procuring_Agency", ""),
            "procurement_type":       p1.get("Procurement_Type", ""),
            "time_left":              time_left,
            "calculated_ending_date": parse_ending_date(time_left),
            "tracker_status":         p1.get("Tracker_Status", "Active"),
            "status":                 p1.get("Status", ""),
            "address":                p3.get("Address", "N/A"),
            "schedule":               p3.get("Schedule", "N/A"),
            "quantity":               p3.get("Quantity", "N/A"),
            "description":            description,
            "view_link":              p1.get("View_Link", p3.get("View_Link", "")),
            "document_iframe_link":   p3.get("Document_Iframe_Link", "N/A"),
            "direct_pdf_link":        p3.get("Direct_PDF_Link", "N/A"),
            "last_updated_at":        datetime.utcnow().isoformat(),
        }
        records.append(record)

    print(f"Upserting {len(records)} tenders to Supabase...")
    # Batch upsert in chunks of 100
    chunk = 100
    for i in range(0, len(records), chunk):
        batch = records[i:i+chunk]
        supabase.table("tenders").upsert(batch, on_conflict="tender_id").execute()
        print(f"  Upserted {min(i+chunk, len(records))}/{len(records)}")

    print("✅ Transform and load complete.")

if __name__ == "__main__":
    run()