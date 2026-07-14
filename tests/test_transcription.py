#!/usr/bin/env python3
"""
模块三：会议室 / Transcription
"""
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestTranscription:

    def test_create_form_title_validation(self, page: Page, login_setup):
        """#8 — 创建会议表单：空标题按钮禁用"""
        page.goto(f"{BASE_URL}/transcription")
        btn = page.locator("button:has-text('创建会议')")
        expect(btn).to_be_disabled()

    def test_create_meeting_success(self, page: Page, login_setup):
        """#9 — 创建会议成功"""
        page.goto(f"{BASE_URL}/transcription")
        page.fill("input[placeholder*='标题']", "测试会议")
        page.click("button:has-text('创建会议')")
        # 会议创建后显示会议信息头
        expect(page.locator(".meeting-header")).to_be_visible(timeout=8000)

    def test_start_meeting_button(self, page: Page, login_setup):
        """#10 — 先创建会议，再检查开始会议按钮可见"""
        page.goto(f"{BASE_URL}/transcription")
        # 先创建一个会议
        page.fill("input[placeholder*='标题']", "测试会议")
        page.click("button:has-text('创建会议')")
        expect(page.locator(".meeting-header")).to_be_visible(timeout=8000)
        # 现在应该能看到开始会议按钮
        start_btn = page.locator("button:has-text('开始会议')")
        expect(start_btn).to_be_visible()

    def test_finish_meeting_confirm(self, page: Page, login_setup):
        """#11 — 先创建并开始会议，再检查结束会议按钮"""
        page.goto(f"{BASE_URL}/transcription")
        # 先创建会议
        page.fill("input[placeholder*='标题']", "测试会议")
        page.click("button:has-text('创建会议')")
        expect(page.locator(".meeting-header")).to_be_visible(timeout=8000)
        # 开始会议
        page.click("button:has-text('开始会议')")
        page.wait_for_timeout(1000)
        # 现在检查结束会议按钮
        finish_btn = page.locator("button:has-text('结束会议')")
        expect(finish_btn).to_be_visible()
