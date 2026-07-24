import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    print("Navigating to http://localhost:8080/ (Smart Watt Dashboard)...")
    # Go directly to dashboard with simulation mode active or explore mode fallback
    page.goto("http://localhost:8080/")

    print("Waiting 12 seconds for the premium splash screen (6s + fade) to fully complete and fade away...")
    page.wait_for_timeout(12000)

    # Confirm we are on the page
    print("Page Title after splash:", page.title())
    print("Page URL after splash:", page.url)

    # Let's take a screenshot of the main preview dashboard
    print("Taking screenshot of the Smart Watt Dashboard...")
    page.screenshot(path="verification/screenshots/smart_watt_dashboard.png")
    print("Saved smart_watt_dashboard.png screenshot")

    # Hold state for the video
    page.wait_for_timeout(2000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        except Exception as e:
            print("Error running script:", e)
        finally:
            context.close()
            browser.close()
            print("Completed verification script run.")
