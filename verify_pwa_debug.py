from playwright.sync_api import sync_playwright

def run_cuj():
    print("Starting Playwright verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        iphone_context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            viewport={"width": 390, "height": 844},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            record_video_dir="/home/jules/verification/videos"
        )

        page = iphone_context.new_page()

        # Listen to console errors and exceptions
        page.on("console", lambda msg: print(f"BROWSER CONSOLE [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER EXCEPTION: {err.message}\n{err.stack}"))

        print("Navigating to http://localhost:8080/")
        page.goto("http://localhost:8080/")

        print("Waiting for premium splash screen to complete (7 seconds)...")
        page.wait_for_timeout(7000)

        page.screenshot(path="/home/jules/verification/screenshots/verification_debug.png")

        iphone_context.close()
        browser.close()

if __name__ == "__main__":
    run_cuj()
