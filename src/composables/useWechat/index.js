import { getWechatConfig } from '@/api/wechat'
import { ref } from 'vue'

export function useWechat() {
  const isWechatReady = ref(false)
  
  // 动态加载微信JS-SDK
  const loadWechatSDK = () => {
    return new Promise((resolve) => {
      if (window.wx) return resolve()
      
      const script = document.createElement('script')
      script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
      script.onload = resolve
      document.body.appendChild(script)
    })
  }
  
  // 初始化微信配置
  const initWechatSDK = async () => {
    try {
      await loadWechatSDK()
      
      const { data } = await getWechatConfig({
        url: window.location.href.split('#')[0]
      })
      
      return new Promise((resolve) => {
        window.wx.config({
          debug: import.meta.env.DEV,
          appId: data.appId,
          timestamp: data.timestamp,
          nonceStr: data.nonceStr,
          signature: data.signature,
          jsApiList: [
            'updateAppMessageShareData',
            'updateTimelineShareData',
            'onMenuShareWeibo',
            'chooseImage',
            'previewImage',
            'getLocation'
          ]
        })
        
        window.wx.ready(() => {
          isWechatReady.value = true
          resolve(true)
        })
        
        window.wx.error((err) => {
          console.error('微信SDK初始化失败', err)
          resolve(false)
        })
      })
    } catch (error) {
      console.error('加载微信配置失败', error)
      return false
    }
  }
  
  // 设置分享内容
  const setShareConfig = (options) => {
    if (!isWechatReady.value) return
    
    const defaultOptions = {
      title: document.title,
      desc: '欢迎访问我们的H5页面',
      link: window.location.href,
      imgUrl: `${window.location.origin}/logo.png`
    }
    
    const shareOptions = { ...defaultOptions, ...options }
    
    // 新版分享接口
    window.wx.updateAppMessageShareData(shareOptions)
    window.wx.updateTimelineShareData(shareOptions)
    
    // 旧版分享接口（兼容）
    window.wx.onMenuShareAppMessage(shareOptions)
    window.wx.onMenuShareTimeline(shareOptions)
  }
  
  return {
    isWechatReady,
    initWechatSDK,
    setShareConfig
  }
}