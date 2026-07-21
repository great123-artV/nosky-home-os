import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    print("Navigating to http://localhost:8080/welcome...")
    page.goto("http://localhost:8080/welcome")
    page.wait_for_timeout(2000) # wait for splash/fade transition

    # Take screenshot at welcome page
    page.screenshot(path="verification/screenshots/welcome.png")
    print("Saved welcome.png screenshot")

    # Let's find any buttons or anchors
    print("Page Title:", page.title())
    print("Page URL:", page.url)

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
