import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GameCard from './GameCard.vue'
import type { Game } from '@/types/game'

const mockGame: Game = {
  id: '2048',
  name: '2048',
  category: '益智',
  description: '经典数字合成游戏',
  icon: '/assets/games/2048.svg',
  route: '/game/2048',
}

const mockGameWithoutIcon: Game = {
  id: 'test',
  name: '测试游戏',
  category: '休闲',
  description: '测试无图标游戏',
  icon: '',
  route: '/game/test',
}

describe('GameCard', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })

  beforeEach(() => {
    router.push('/')
  })

  it('应渲染游戏名称', () => {
    const wrapper = mount(GameCard, {
      global: {
        plugins: [router],
      },
      props: {
        game: mockGame,
        index: 0,
      },
    })

    expect(wrapper.text()).toContain('2048')
  })

  it('应渲染游戏分类', () => {
    const wrapper = mount(GameCard, {
      global: {
        plugins: [router],
      },
      props: {
        game: mockGame,
        index: 0,
      },
    })

    expect(wrapper.text()).toContain('益智')
  })

  it('应渲染游戏描述', () => {
    const wrapper = mount(GameCard, {
      global: {
        plugins: [router],
      },
      props: {
        game: mockGame,
        index: 0,
      },
    })

    expect(wrapper.text()).toContain('经典数字合成游戏')
  })

  it('应渲染获取按钮', () => {
    const wrapper = mount(GameCard, {
      global: {
        plugins: [router],
      },
      props: {
        game: mockGame,
        index: 0,
      },
    })

    expect(wrapper.find('.ios-get-button').exists()).toBe(true)
    expect(wrapper.find('.ios-get-button').text()).toBe('获取')
  })

  it('点击卡片应导航到游戏页面', async () => {
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(GameCard, {
      global: {
        plugins: [router],
      },
      props: {
        game: mockGame,
        index: 0,
      },
    })

    await wrapper.find('.ios-game-card').trigger('click')

    expect(pushSpy).toHaveBeenCalledWith('/game/2048')
  })

  it('有图标时应显示图标图片', () => {
    const wrapper = mount(GameCard, {
      global: {
        plugins: [router],
      },
      props: {
        game: mockGame,
        index: 0,
      },
    })

    expect(wrapper.find('.ios-app-icon-img').exists()).toBe(true)
    expect(wrapper.find('.ios-app-icon-img').attributes('src')).toBe('/assets/games/2048.svg')
    expect(wrapper.find('.ios-app-icon-text').exists()).toBe(false)
  })

  it('无图标时应显示文字缩写', () => {
    const wrapper = mount(GameCard, {
      global: {
        plugins: [router],
      },
      props: {
        game: mockGameWithoutIcon,
        index: 0,
      },
    })

    expect(wrapper.find('.ios-app-icon-img').exists()).toBe(false)
    expect(wrapper.find('.ios-app-icon-text').exists()).toBe(true)
    expect(wrapper.find('.ios-app-icon-text').text()).toBe('测试')
  })

  it('无图标游戏不同索引应有不同渐变色背景', () => {
    const wrapper0 = mount(GameCard, {
      global: {
        plugins: [router],
      },
      props: {
        game: mockGameWithoutIcon,
        index: 0,
      },
    })

    const wrapper5 = mount(GameCard, {
      global: {
        plugins: [router],
      },
      props: {
        game: mockGameWithoutIcon,
        index: 5,
      },
    })

    const style0 = wrapper0.find('.ios-app-icon-large').attributes('style')
    const style5 = wrapper5.find('.ios-app-icon-large').attributes('style')

    expect(style0).not.toBe(style5)
  })
})
