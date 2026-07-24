from playwright.sync_api import sync_playwright
import os

def run_debug(page):
    os.makedirs("verification/screenshots", exist_ok=True)

    # Directly go to explore ecosystem dashboard
    print("Navigating directly to explore dashboard...")
    page.goto("http://localhost:8080/ecosystem?mode=explore")
    page.wait_for_timeout(4000)
    page.screenshot(path="verification/screenshots/debug_explore.png")

    # Let's print out all button names on the page
    buttons = page.locator("button").all_inner_texts()
    print("Buttons found:", buttons)

    # Let's print out all link names on the page
    links = page.locator("a").all_inner_texts()
    print("Links found:", links)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_debug(page)
        finally:
            browser.close()
