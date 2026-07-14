#!/usr/bin/env python3
"""
模块二：工作台 / Dashboard
"""
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


class TestDashboard:

    def test_stat_cards_visible(self, page: Page, login_setup):
        """#4 — 统计卡片显示"""
        page.goto(f"{BASE_URL}/dashboard")
        # 4 张 stat-card
        cards = page.locator(".stat-card")
        expect(cards).to_have_count(4)

    def test_meeting_list_loaded(self, page: Page, login_setup):
        """#5 — 会议列表加载"""
        page.goto(f"{BASE_URL}/dashboard")
        # 列表区域可见（有数据或空状态）
        list_area = page.locator(".meeting-list, .empty-state")
        expect(list_area).to_be_visible()

    def test_search_filter(self, page: Page, login_setup):
        """#6 — 搜索筛选"""
        page.goto(f"{BASE_URL}/dashboard")
        search_input = page.locator("input[placeholder*='搜索']")
        expect(search_input).to_be_visible()

    def test_status_filter(self, page: Page, login_setup):
        """#7 — 状态下拉筛选"""
        page.goto(f"{BASE_URL}/dashboard")
        status_select = page.locator("select").first
        expect(status_select).to_be_visible()
        status_select.select_option("RECORDING")
