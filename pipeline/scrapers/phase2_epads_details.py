import csv
import time
import os
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service

# --- CONFIGURATION ---
load_dotenv()
EPADS_EMAIL = os.getenv("EPADS_EMAIL")
EPADS_PASSWORD = os.getenv("EPADS_PASSWORD")

if not EPADS_EMAIL or not EPADS_PASSWORD:
    raise ValueError("Missing credentials! Check your .env file.")

# --- FILE PATHS ---
LIST_CSV = os.path.join(os.path.dirname(__file__), "../data/1_tenders_list.csv")
DETAIL_CSV = os.path.join(os.path.dirname(__file__), "../data/2_tenders_detailed.csv")

# NEW: Added 'Document_Iframe_Link' to handle the alternate page layouts
FIELDNAMES = ["Tender_ID", "Address", "Schedule", "Quantity", "Description", "Document_Iframe_Link", "View_Link"]

def login_to_epads(driver, wait):
    """Performs a fresh, secure login for Phase 2."""
    print("Logging into EPADS for deep scrape...")
    driver.get("https://vendors.epads.gov.pk/login")
    time.sleep(3) 
    
    email_field = wait.until(EC.element_to_be_clickable((By.NAME, "email")))
    email_field.clear()
    email_field.send_keys(EPADS_EMAIL)
    
    password_field = wait.until(EC.element_to_be_clickable((By.NAME, "password")))
    password_field.clear()
    password_field.send_keys(EPADS_PASSWORD)
    
    submit_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']")))
    driver.execute_script("arguments[0].click();", submit_btn)
    
    time.sleep(5) 
    print("Login successful. Starting link extraction...")

def get_scraped_links():
    """Returns a set of View_Links we have already scraped, so we can resume if interrupted."""
    if not os.path.exists(DETAIL_CSV):
        return set()
    with open(DETAIL_CSV, "r", encoding="utf-8") as f:
        return {row["View_Link"] for row in csv.DictReader(f) if "View_Link" in row}

def scrape_details():
    if not os.path.exists(LIST_CSV):
        print("No tender list found! Run Phase 1 first.")
        return

    # 1. Read the list of ACTIVE tenders only
    tenders_to_scrape = []
    with open(LIST_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("Tracker_Status") == "Active" and row.get("View_Link"):
                tenders_to_scrape.append(row)
                
    print(f"Found {len(tenders_to_scrape)} ACTIVE tenders to check for details.")

    already_scraped = get_scraped_links()
    
    # 2. Setup Selenium
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.binary_location = "/usr/bin/chromium-browser"

    service = Service("/usr/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)
    wait = WebDriverWait(driver, 20)
    
    try:
        login_to_epads(driver, wait)

        file_exists = os.path.exists(DETAIL_CSV)
        with open(DETAIL_CSV, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            if not file_exists:
                writer.writeheader()

            for tender in tenders_to_scrape:
                link = tender["View_Link"]
                tender_id = tender.get("Tender_ID", "Unknown")

                if link in already_scraped:
                    continue

                print(f"Scraping details for {tender_id}...")
                driver.get(link)
                time.sleep(3) # Give the detail page time to render

                try:
                    body_text = driver.find_element(By.TAG_NAME, "body").text
                    
                    # More robust extraction helper that checks if strings actually exist
                    def extract_between(text, start_str, end_str):
                        try:
                            if start_str not in text:
                                return "N/A"
                            start_idx = text.index(start_str) + len(start_str)
                            if end_str and end_str in text[start_idx:]:
                                end_idx = text.index(end_str, start_idx)
                                return text[start_idx:end_idx].strip()
                            return text[start_idx:].strip()
                        except ValueError:
                            return "N/A"

                    # 1. Attempt to extract standard fields (will safely return "N/A" if missing)
                    address = extract_between(body_text, "Address:", "Schedule:")
                    schedule = extract_between(body_text, "Schedule:", "Quantity:")
                    quantity = extract_between(body_text, "Quantity:", "Qty:")
                    description = extract_between(body_text, "Items Without Lots", "Address:")

                    # 2. Handle the Document Viewer Layout fallback
                    document_link = "N/A"
                    iframes = driver.find_elements(By.CSS_SELECTOR, "iframe.iframe-content")
                    
                    if iframes: # If the iframe exists, it's a document page
                        document_link = iframes[0].get_attribute("src")
                        
                        # Grab the document title since the standard description is missing
                        if description == "N/A":
                            description = extract_between(body_text, "non-responsive.", "View Clarifications")
                            if description == "N/A":
                                description = "Embedded Bidding Document (See Link)"

                    writer.writerow({
                        "Tender_ID": tender_id,
                        "Address": address,
                        "Schedule": schedule,
                        "Quantity": quantity,
                        "Description": description,
                        "Document_Iframe_Link": document_link, # Saves the iframe URL
                        "View_Link": link
                    })
                    f.flush()

                except Exception as e:
                    print(f"Error extracting data for {tender_id}: {e}")

    except Exception as e:
        print(f"Pipeline crashed: {e}")
    finally:
        driver.quit()
        print("Phase 2 complete.")

if __name__ == "__main__":
    scrape_details()