from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Ensure verification directories exist
    os.makedirs("verification/screenshots", exist_ok=True)
    os.makedirs("verification/videos", exist_ok=True)

    # 1. Start at welcome page
    print("Navigating to welcome page...")
    page.goto("http://localhost:8080/welcome")
    page.wait_for_timeout(2000)
    page.screenshot(path="verification/screenshots/1_welcome.png")

    # 2. Click on "Explore Nosky Smart"
    print("Clicking 'Explore Nosky Smart'...")
    page.get_by_role("link", name="Explore Nosky Smart").click()
    page.wait_for_timeout(2500)
    page.screenshot(path="verification/screenshots/2_explore_dashboard.png")

    # 3. Trigger a restricted action (Click 'Open Control Center' in SMART WATT card)
    print("Triggering restricted action (Open Control Center)...")
    page.get_by_role("button", name="Open Control Center").click()
    page.wait_for_timeout(1500)
    page.screenshot(path="verification/screenshots/3_unlock_modal.png")

    # 4. Click 'Continue Exploring' in the Unlock Modal
    print("Dismissing Unlock modal...")
    page.get_by_role("button", name="Continue Exploring").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/screenshots/4_back_to_exploring.png")

    # 5. Open Cypher introduction
    print("Opening Cypher...")
    page.get_by_text("Meet Cypher Voice Assistant").click()
    page.wait_for_timeout(2000)
    page.screenshot(path="verification/screenshots/5_cypher_drawer_open.png")

    print("Verification journey complete.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
