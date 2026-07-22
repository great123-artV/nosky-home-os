import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    print("Navigating to http://localhost:8080/ecosystem?mode=explore...")
    page.goto("http://localhost:8080/ecosystem?mode=explore")

    print("Waiting 12 seconds for the premium splash screen (6s + fade) to fully complete and fade away...")
    page.wait_for_timeout(12000)

    # Confirm we are on the page and the splash is gone
    print("Page Title after splash:", page.title())
    print("Page URL after splash:", page.url)

    # Let's wait for the text to be visible to be absolutely sure
    page.wait_for_selector("text=My Home (Preview)", timeout=5000)

    # Let's take a screenshot of the main preview dashboard
    print("Taking screenshot of the Explore Mode dashboard...")
    page.screenshot(path="verification/screenshots/explore_mode.png")
    print("Saved explore_mode.png screenshot")

    # Let's check for "My Home (Preview)" text to verify our mock Home card is rendered
    has_preview_home = page.locator("text=My Home (Preview)").is_visible()
    print("Does 'My Home (Preview)' card exist?", has_preview_home)

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
        finally:
            context.close()
            browser.close()
            print("Completed verification script run.")
