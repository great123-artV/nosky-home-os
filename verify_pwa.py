import sys
from playwright.sync_api import sync_playwright

def run_cuj():
    print("Starting Playwright verification...")
    with sync_playwright() as p:
        # Launch headless browser
        browser = p.chromium.launch(headless=True)

        # Emulate iPhone Safari to test the iOS installation guidance banner
        iphone_context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            viewport={"width": 390, "height": 844},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            record_video_dir="/home/jules/verification/videos"
        )

        page = iphone_context.new_page()
        print("Navigating to http://localhost:8080/")
        page.goto("http://localhost:8080/")

        # Wait for the premium 6.0 seconds splash screen progress bar to finish and fade out
        print("Waiting for premium splash screen to complete (7 seconds)...")
        page.wait_for_timeout(7000)

        # Check if the iPhone/iOS Safari install banner is visible
        print("Taking landing page screenshot...")
        page.screenshot(path="/home/jules/verification/screenshots/verification.png")

        # Click 'View steps' to check the instruction panel
        print("Clicking 'View steps' in iOS installation helper...")
        try:
            view_steps_btn = page.get_by_role("button", name="View steps")
            if view_steps_btn.is_visible():
                view_steps_btn.click()
                page.wait_for_timeout(1000)
                # Take another screenshot of the open modal instructions
                page.screenshot(path="/home/jules/verification/screenshots/verification_ios_steps.png")
                print("Modal instructions opened and screenshot saved.")
        except Exception as e:
            print(f"Error clicking view steps: {e}")

        iphone_context.close()
        browser.close()
        print("Playwright verification completed successfully!")

if __name__ == "__main__":
    run_cuj()
