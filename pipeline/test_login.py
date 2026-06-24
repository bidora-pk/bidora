import os
import time
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Load local .env if running on your PC
load_dotenv('.env')
load_dotenv()

def verify_secrets_securely():
    print("\n--- 🔐 SECURE SECRET VERIFICATION ---")
    secrets_to_check = {
        "EPADS_EMAIL": os.getenv("EPADS_EMAIL"),
        "EPADS_PASSWORD": os.getenv("EPADS_PASSWORD"),
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_SERVICE_KEY": os.getenv("SUPABASE_SERVICE_KEY")
    }

    all_good = True
    for name, value in secrets_to_check.items():
        if not value:
            print(f"❌ {name}: MISSING OR EMPTY!")
            all_good = False
        elif len(value) < 4:
            print(f"❌ {name}: TOO SHORT (Only {len(value)} characters)")
            all_good = False
        else:
            # Print only the first 2 characters for security, plus the total length
            masked = f"{value[:2]}*** (Length: {len(value)})"
            print(f"✅ {name}: Loaded correctly -> {masked}")
    
    return all_good

def test_epads_login():
    print("\n--- 🌐 TESTING EPADS LOGIN ---")
    
    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    
    if os.getenv("GITHUB_ACTIONS") == "true":
        print("🤖 Running on GitHub: Enabling Headless Mode")
        options.add_argument("--headless=new")
    else:
        print("💻 Running Locally: Opening visible Chrome window")

    try:
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 20)
        
        email = os.getenv("EPADS_EMAIL")
        password = os.getenv("EPADS_PASSWORD")

        print("1. Opening login page...")
        driver.get("https://vendors.epads.gov.pk/login")
        time.sleep(3) 
        
        print("2. Entering credentials...")
        email_field = wait.until(EC.element_to_be_clickable((By.NAME, "email")))
        email_field.clear()
        email_field.send_keys(email)
        
        password_field = wait.until(EC.element_to_be_clickable((By.NAME, "password")))
        password_field.clear()
        password_field.send_keys(password)
        
        print("3. Clicking submit...")
        submit_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']")))
        driver.execute_script("arguments[0].click();", submit_btn)
        
        # Wait to see if the URL changes away from the login page
        print("4. Waiting for dashboard response...")
        time.sleep(5) 
        
        current_url = driver.current_url
        if "login" not in current_url.lower():
            print(f"✅ SUCCESS! Successfully logged into EPADS. Current URL: {current_url}")
        else:
            print("❌ FAILED: Still on the login page. Check if EPADS is showing a CAPTCHA or invalid password error.")
            
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR DURING LOGIN:\n{e}")
    finally:
        try:
            driver.quit()
        except:
            pass

if __name__ == "__main__":
    if verify_secrets_securely():
        test_epads_login()
    else:
        print("\n⚠️ Skipping login test because secrets are missing.")