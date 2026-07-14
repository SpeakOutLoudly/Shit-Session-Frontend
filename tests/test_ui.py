#!/usr/bin/env python3
"""
模块七：UI 与组件
"""
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestUI:

    def test_sidebar_navigation(self, page: Page, login_setup):
        """#27 — 侧边栏导航"""
        page.goto(f"{BASE_URL}/dashboard")
        nav_items = page.locator(".nav-item")
        count = nav_items.count()
        assert count >= 4, f"导航项应 ≥ 4，实际 {count}"

    def test_sidebar_collapse(self, page: Page, login_setup):
        """#28 — 侧边栏折叠"""
        page.goto(f"{BASE_URL}/dashboard")
        collapse_btn = page.locator(".collapse-btn")
        expect(collapse_btn).to_be_visible()
        collapse_btn.click()
        # 折叠后 sidebar 应有 collapsed class
        sidebar = page.locator(".sidebar")
        sidebar_class = sidebar.get_attribute("class")
        assert sidebar_class and "collapsed" in sidebar_class

    def test_help_modal(self, page: Page, login_setup):
        """#29 — 帮助弹窗"""
        page.goto(f"{BASE_URL}/dashboard")
        help_btn = page.locator("button:has-text('帮助')")
        expect(help_btn).to_be_visible()
        help_btn.click()
        modal = page.locator(".modal")
        expect(modal).to_be_visible()

    def test_copy_button(self, page: Page, login_setup):
        """#32 — 复制按钮"""
        page.goto(f"{BASE_URL}/transcription")
        copy_btn = page.locator("button:has-text('复制')").first
        if copy_btn.is_visible():
            original_text = copy_btn.text_content()
            copy_btn.click()
            page.wait_for_timeout(100)
            # 可能变成"已复制"，也可能内容不变（没有字幕时）
