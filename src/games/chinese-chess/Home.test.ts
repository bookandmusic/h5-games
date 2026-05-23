import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import ChineseChessHome from './Home.vue'

describe('ChineseChessHome', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('遮罩渲染在 body 层级，不被游戏容器约束', async () => {
    const wrapper = mount(ChineseChessHome, {
      global: { plugins: [router, createPinia()] },
      attachTo: document.body,
    })

    // 默认遮罩未显示
    expect(document.body.querySelectorAll('.overlay').length).toBe(0)

    // 点击头像打开 profile 遮罩
    const btn = wrapper.find('.plaque-body')
    await btn.trigger('click')
    await wrapper.vm.$nextTick()

    // 遮罩应在 body 而非 wrapper 内
    const localOverlay = wrapper.find('.overlay')
    expect(localOverlay.exists()).toBe(false) // RED: currently true (no Teleport)

    const bodyOverlay = document.body.querySelector('.overlay')
    expect(bodyOverlay).not.toBeNull()
    expect(bodyOverlay?.textContent).toContain('个人资料')

    wrapper.unmount()
  })
})
