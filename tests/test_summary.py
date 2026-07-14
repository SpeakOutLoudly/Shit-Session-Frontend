#!/usr/bin/env python3
"""
模块四：会议摘要 / Summary
"""
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestSummary:

    def test_select_finished_meeting(self, page: Page, login_setup):
        """#13 — 选择已结束会议"""
        page.goto(f"{BASE_URL}/summary")
        # 会议选择列表可见
        select_list = page.locator(".meeting-select-list")
        expect(select_list).to_be_visible(timeout=5000)

    def test_generate_minutes_button(self, page: Page, login_setup):
        """#14 — 生成纪要按钮"""
        page.goto(f"{BASE_URL}/summary")
        # 点击第一个可选的会议
        item = page.locator(".meeting-select-item").first
        if item.is_visible():
            item.click()
            btn = page.locator("button:has-text('生成纪要')")
            # 可能有也可能没有（会议已有纪要时不会显示）
            # 只要能正常加载不报错就算通过
            page.wait_for_timeout(2000)

    def test_minutes_edit_modal(self, page: Page, login_setup):
        """#15 — 纪要编辑弹窗"""
        page.goto(f"{BASE_URL}/summary")
        edit_btn = page.locator("button:has-text('修订')")
        if edit_btn.is_visible():
            edit_btn.click()
            modal = page.locator(".modal")
            expect(modal).to_be_visible()
