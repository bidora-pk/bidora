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


load_dotenv('.env')

# --- CONFIGURATION ---
load_dotenv()
EPADS_EMAIL = os.getenv("EPADS_EMAIL")
EPADS_PASSWORD = os.getenv("EPADS_PASSWORD")

OUTPUT_CSV = os.path.join(os.path.dirname(__file__), "../data/1_tenders_list.csv")

FIELDNAMES = [
    "Tender_ID", "Title", "Procuring_Agency", "Procurement_Type", 
    "Time_Left", "Status", "View_Link", "Tracker_Status"
]

def scrape_federal():
    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    
    # AUTOMATIC ENVIRONMENT DETECTION
    if os.getenv("GITHUB_ACTIONS") == "true":
        print("Running on GitHub: Enabling Headless Mode")
        options.add_argument("--headless=new")
    else:
        print("Running Locally: Opening visible Chrome window")

    # Let Selenium auto-detect the driver paths based on the OS
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 20)

    try:
        # ==========================================
        # STEP 1: LOGIN TO EPADS
        # ==========================================
        print("Logging into EPADS...")
        driver.get("https://vendors.epads.gov.pk/login")
        
        # Give the website's JavaScript a few seconds to finish rendering overlays
        time.sleep(3) 
        
        # Wait until the email field is physically visible and clickable
        email_field = wait.until(EC.element_to_be_clickable((By.NAME, "email")))
        email_field.clear()
        email_field.send_keys(EPADS_EMAIL)
        
        password_field = wait.until(EC.element_to_be_clickable((By.NAME, "password")))
        password_field.clear()
        password_field.send_keys(EPADS_PASSWORD)
        
        # Find the submit button and click it
        submit_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']")))
        
        # Sometimes standard clicks fail if the UI framework creates weird overlapping layers. 
        # Using JavaScript to click bypasses this issue entirely.
        driver.execute_script("arguments[0].click();", submit_btn)
        
        # Wait for the dashboard to fully load after login
        time.sleep(5) 
        print("Login complete.")


        # ==========================================
        # STEP 2: LOAD EXISTING DATA (The Upsert Prep)
        # ==========================================
        master_tenders = {}
        
        # If the file exists, load it into a dictionary
        if os.path.exists(OUTPUT_CSV):
            with open(OUTPUT_CSV, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Filter out any weird blank rows, ensure ID exists
                    if row.get("Tender_ID"): 
                        master_tenders[row["Tender_ID"]] = row
            print(f"Loaded {len(master_tenders)} existing tenders from history.")

        # Keep track of what is currently live on the site
        active_ids_this_run = set()

        # ==========================================
        # STEP 3: PAGINATION LOOP
        # ==========================================
        page = 1
        
        while True:
            print(f"Scraping Page {page}...")
            url = f"https://vendors.epads.gov.pk/federal/procurements/active-procurements?page={page}"
            driver.get(url)
            time.sleep(4) 
            
            rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
            
            if not rows or len(rows) == 0 or (len(rows) == 1 and "no records" in rows[0].text.lower()):
                break
            
            rows_on_page = 0
            for row in rows:
                cols = row.find_elements(By.TAG_NAME, "td")
                if len(cols) < 7: continue
                
                # Extract Title and ID
                raw_title = cols[1].text.strip()
                title_parts = [p.strip() for p in raw_title.split('\n') if p.strip()]
                actual_title = title_parts[0] if len(title_parts) > 0 else raw_title
                tender_id = title_parts[-1] if len(title_parts) > 1 else ""

                if not tender_id:
                    continue # Skip if we can't find a valid ID

                # Record that we saw this ID today
                active_ids_this_run.add(tender_id)

                # UPSERT: Add new or update existing
                master_tenders[tender_id] = {
                    "Tender_ID":        tender_id,
                    "Title":            actual_title,
                    "Procuring_Agency": cols[2].text.strip(),
                    "Procurement_Type": cols[3].text.strip().replace("\n", " - "),
                    "Time_Left":        cols[4].text.strip(),
                    "Status":           cols[6].text.strip(),
                    "View_Link":        row.find_element(By.CSS_SELECTOR, "a[href*='procurements/view']").get_attribute("href") if row.find_elements(By.CSS_SELECTOR, "a[href*='procurements/view']") else "",
                    "Tracker_Status":   "Active" # It's on the site right now
                }
                rows_on_page += 1

            if rows_on_page == 0:
                break
            
            page += 1

        # ==========================================
        # STEP 4: MARK EXPIRED & SAVE
        # ==========================================
        
        # Check all historical tenders. If they weren't on the site today, they expired.
        for t_id, data in master_tenders.items():
            if t_id not in active_ids_this_run:
                data["Tracker_Status"] = "Expired"
                data["Time_Left"] = "0h 0m Left" # Cleanup old countdowns

        # Write the completely updated dictionary back to the CSV
        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            writer.writeheader()
            for t_id, data in master_tenders.items():
                writer.writerow(data)

        print(f"\n✅ Pipeline complete! Total tenders tracked: {len(master_tenders)} | Active right now: {len(active_ids_this_run)}")

    except Exception as e:
        print(f"An error occurred: {e}")
    
    finally:
        driver.quit()

if __name__ == "__main__":
    scrape_federal()