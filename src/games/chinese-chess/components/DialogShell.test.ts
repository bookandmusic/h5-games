import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import DialogShell from './DialogShell.vue'

describe('DialogShell', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    wrapper = mount(DialogShell, {
      props: { title: '提示' },
      slots: { default: '<p class="test-content">内容</p>' },
      attachTo: document.body,
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('遮罩渲染在 body 层级', () => {
    const localOverlay = wrapper.find('.overlay')
    const bodyOverlay = document.body.querySelector('.overlay')
    expect(localOverlay.exists()).toBe(false)
    expect(bodyOverlay).not.toBeNull()
  })

  it('弹窗标题渲染', () => {
    const bodyOverlay = document.body.querySelector('.overlay')
    expect(bodyOverlay?.textContent).toContain('提示')
  })

  it('弹窗插槽内容渲染', () => {
    const bodyOverlay = document.body.querySelector('.overlay')
    expect(bodyOverlay?.textContent).toContain('内容')
  })

  it('点击遮罩触发 close 事件', async () => {
    const bodyOverlay = document.body.querySelector('.overlay') as HTMLElement
    if (bodyOverlay) {
      bodyOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
