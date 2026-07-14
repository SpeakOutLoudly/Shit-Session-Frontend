#!/usr/bin/env python3
"""
模块六：导出与同步 / Export
"""
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestExport:

    def test_meeting_selection(self, page: Page, login_setup):
        """#21 — 选择会议纪要"""
        page.goto(f"{BASE_URL}/export")
        select_list = page.locator(".meeting-select-list")
        expect(select_list).to_be_visible(timeout=5000)

    def test_word_export_button(self, page: Page, login_and_feishu_setup):
        """#22 — Word 导出按钮"""
        page.goto(f"{BASE_URL}/export")
        # 先选一个会议
        item = page.locator(".meeting-select-item").first
        if item.is_visible():
            item.click()
            page.wait_for_timeout(1000)
            # 点击 Word 格式卡片
            page.locator(".format-card:has-text('Word')").first.click()
            export_btn = page.locator("button:has-text('导出')")
            expect(export_btn).to_be_enabled()

    def test_pdf_export_button(self, page: Page, login_and_feishu_setup):
        """#23 — PDF 导出"""
        page.goto(f"{BASE_URL}/export")
        item = page.locator(".meeting-select-item").first
        if item.is_visible():
            item.click()
            page.wait_for_timeout(1000)
            page.locator(".format-card:has-text('PDF')").first.click()
            export_btn = page.locator("button:has-text('导出')")
            expect(export_btn).to_be_enabled()

    def test_feishu_oauth_section(self, page: Page, login_setup):
        """#24 — 飞书授权区域可见"""
        page.goto(f"{BASE_URL}/export")
        page.wait_for_timeout(1500)
        # mock 模式下自动返回已授权用户，所以显示"已授权"标签
        authorized = page.locator("text=已授权")
        expect(authorized).to_be_visible()

    def test_sync_without_meeting(self, page: Page, login_and_feishu_setup):
        """#25 — 未选择会议时同步"""
        page.goto(f"{BASE_URL}/export")
        sync_btn = page.locator("button:has-text('同步到飞书')")
        sync_btn.click()
        # Toast 警告应该弹出
        page.wait_for_timeout(1000)
        toast = page.locator(".toast-warning, .toast")
        expect(toast).to_be_visible()

    def test_assignee_mapping(self, page: Page, login_and_feishu_setup):
        """#26 — 任务负责人关联"""
        page.goto(f"{BASE_URL}/export")
        # 展开高级设置
        advanced_btn = page.locator("button:has-text('任务负责人关联')")
        if advanced_btn.is_visible():
            advanced_btn.click()
            page.wait_for_timeout(500)
            add_btn = page.locator("button:has-text('添加一行')")
            expect(add_btn).to_be_visible()
