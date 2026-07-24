from playwright.sync_api import sync_playwright

def run_debug(page):
    page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

    print("Navigating to explore dashboard...")
    page.goto("http://localhost:8080/ecosystem?mode=explore")
    page.wait_for_timeout(5000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_debug(page)
        finally:
            browser.close()
