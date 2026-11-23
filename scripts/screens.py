"""Captures d'écran de vérification (desktop + mobile) — nécessite `npm run build` et un serveur sur :4173."""
import asyncio
from playwright.async_api import async_playwright

URL = "http://localhost:4173/"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for name, vp in [("desk", {"width": 1280, "height": 900}), ("mob", {"width": 390, "height": 844})]:
            page = await browser.new_page(viewport=vp)
            logs = []
            page.on("console", lambda m: logs.append(m.text))
            page.on("pageerror", lambda e: logs.append("ERR " + str(e)))
            await page.goto(URL + "#ca/7/56")
            await page.wait_for_timeout(1500)
            await page.screenshot(path=f"/tmp/{name}_1.png", full_page=True)
            if name == "desk":
                await page.click(".play")
                await page.wait_for_timeout(2500)
                print("time", await page.inner_text(".times"))
                await page.screenshot(path=f"/tmp/{name}_2.png", full_page=True)
                await page.click(".knife-btn")
                await page.wait_for_timeout(350)
                await page.screenshot(path=f"/tmp/{name}_mid.png")
                await page.wait_for_timeout(1500)
                await page.screenshot(path=f"/tmp/{name}_3.png", full_page=True)
                print("hash", await page.evaluate("location.hash"))
                book = page.locator(".picker input").nth(0)
                await book.fill("XC")
                await page.click(".go")
                await page.wait_for_timeout(300)
                print("msg", await page.inner_text(".msg"))
                await book.fill("")
                await book.type("4 12")
                await page.wait_for_timeout(100)
                print("vals", await book.input_value(), await page.locator(".picker input").nth(1).input_value())
                await page.click(".go")
                await page.wait_for_timeout(1500)
                print("hash", await page.evaluate("location.hash"), await page.inner_text(".times"))
                await page.click(".langs button >> nth=2")
                await page.wait_for_timeout(600)
                await page.screenshot(path=f"/tmp/{name}_fr.png", full_page=True)
            print(name, logs[:10])
        await browser.close()


asyncio.run(main())
