import csv
import time
import os
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# --- FILE PATHS ---
PHASE2_CSV = os.path.join(os.path.dirname(__file__), "../data/2_tenders_detailed.csv")
PHASE3_CSV = os.path.join(os.path.dirname(__file__), "../data/3_tenders_final.csv")

FIELDNAMES = ["Tender_ID", "Address", "Schedule", "Quantity", "Description", "Document_Iframe_Link", "Direct_PDF_Link", "View_Link"]

def get_already_processed_ids():
    if not os.path.exists(PHASE3_CSV):
        return set()
    with open(PHASE3_CSV, "r", encoding="utf-8") as f:
        return {row["Tender_ID"] for row in csv.DictReader(f) if "Tender_ID" in row}

def extract_clean_text(html_source):
    clean_html = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', html_source, flags=re.IGNORECASE | re.DOTALL)
    clean_text = re.sub(r'<[^>]+>', ' ', clean_html)
    return re.sub(r'\s+', ' ', clean_text).strip()

def scrape_iframes():
    if not os.path.exists(PHASE2_CSV):
        print("Phase 2 CSV not found! Run Phase 2 first.")
        return

    tenders = []
    with open(PHASE2_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tenders.append(row)

    processed_ids = get_already_processed_ids()
    
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.binary_location = "/usr/bin/chromium-browser"

    service = Service("/usr/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)
    try:
        file_exists = os.path.exists(PHASE3_CSV)
        with open(PHASE3_CSV, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            if not file_exists:
                writer.writeheader()

            for tender in tenders:
                t_id = tender.get("Tender_ID", "Unknown")
                
                if t_id in processed_ids:
                    continue

                iframe_url = tender.get("Document_Iframe_Link", "N/A")
                view_link = tender.get("View_Link", "N/A")
                
                # --- 1. AGGRESSIVE DESCRIPTION FIX ---
                if iframe_url != "N/A":
                    desc = tender.get("Description", "")
                    if desc == "N/A" or desc.strip() == "" or "eligible" in desc.lower() or "expression" in desc.lower() or "pre-q" in desc.lower():
                        tender["Description"] = "Embedded Bidding Document (See Link)"

                needs_pdf = iframe_url != "N/A"
                needs_details = tender.get("Address", "N/A") == "N/A" or tender.get("Quantity", "N/A") == "N/A"

                if needs_pdf or needs_details:
                    target_url = iframe_url if iframe_url != "N/A" else view_link

                    if target_url != "N/A":
                        if iframe_url != "N/A":
                            print(f"[FETCHING IFRAME] -> {t_id} (Extracting PDF & Details)")
                        else:
                            print(f"[FETCHING VIEW_LINK] -> {t_id} (Rescuing Missing Details)")
                            
                        driver.get(target_url)
                        time.sleep(3) 
                        
                        html_source = driver.page_source
                        clean_text = extract_clean_text(html_source)
                        
                        # -- EXTRACT PDF --
                        if iframe_url != "N/A":
                            pdf_match = re.search(r'<a[^>]+href=["\']([^"\']+\.pdf[^"\']*)["\']', html_source, re.IGNORECASE)
                            direct_pdf = pdf_match.group(1) if pdf_match else "N/A"
                            if direct_pdf != "N/A" and direct_pdf.startswith("/"):
                                direct_pdf = "https://pa.epads.gov.pk" + direct_pdf
                            tender["Direct_PDF_Link"] = direct_pdf
                        else:
                            tender["Direct_PDF_Link"] = "N/A"

                        # -- CONSTRAINED EXTRACTION LIMITS (FIX) --
                        # Notice the {1,250}? instead of (.*?) - This prevents runaway text capturing!
                        
                        if tender.get("Address", "N/A") == "N/A":
                            m = re.search(r'Address:\s*(.{1,350}?)(?=\s*(?:Schedule:|Quantity:|Bid Security:|Warranty:|$))', clean_text, re.IGNORECASE)
                            if m: tender["Address"] = m.group(1).strip()

                        if tender.get("Schedule", "N/A") == "N/A":
                            m = re.search(r'Schedule:\s*(.{1,150}?)(?=\s*(?:Quantity:|Bid Security:|Warranty:|$))', clean_text, re.IGNORECASE)
                            if m: tender["Schedule"] = m.group(1).strip()

                        if tender.get("Quantity", "N/A") == "N/A":
                            m = re.search(r'Quantity:\s*(.{1,150}?)(?=\s*(?:Bid Security:|Warranty:|$))', clean_text, re.IGNORECASE)
                            if m: tender["Quantity"] = m.group(1).strip()

                else:
                    print(f"[INSTANT SAVE] -> {t_id} (Data already complete, skipping browser)")
                    tender["Direct_PDF_Link"] = "N/A"
                
                # Write to file
                clean_row = {field: tender.get(field, "N/A") for field in FIELDNAMES}
                writer.writerow(clean_row)
                f.flush()

    except Exception as e:
        print(f"Phase 3 Pipeline crashed: {e}")
    finally:
        driver.quit()
        print("Phase 3 complete! Dataset fully enriched.")

if __name__ == "__main__":
    scrape_iframes()