import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useWechat } from '@/composables/useWechat'

export function useAuth() {
  const router = useRouter()
  const { isWechatReady } = useWechat()
  
  const userInfo = ref(null)
  const isLogin = ref(false)
  
  // 检查登录状态
  const checkLogin = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return false
      
      const { data } = await axios.get('/api/user/info')
      userInfo.value = data
      isLogin.value = true
      return true
    } catch (error) {
      clearAuth()
      return false
    }
  }
  
  // 微信授权登录
  const wechatLogin = async () => {
    if (!isWechatReady.value) {
      return router.push('/login')
    }
    
    // 1. 获取code
    const code = await getWechatCode()
    if (!code) return
    
    // 2. 用code换取token
    try {
      const { data } = await axios.post('/api/auth/wechat', { code })
      localStorage.setItem('token', data.token)
      userInfo.value = data.userInfo
      isLogin.value = true
      return true
    } catch (error) {
      console.error('微信登录失败', error)
      return false
    }
  }
  
  // 获取微信code
  const getWechatCode = () => {
    return new Promise((resolve) => {
      window.wx.ready(() => {
        window.wx.invoke(
          'getWxCode',
          {
            appid: process.env.VUE_APP_WECHAT_APPID,
            scope: 'snsapi_userinfo',
            state: 'wechat_auth'
          },
          (res) => {
            if (res.err_msg === 'getWxCode:ok') {
              resolve(res.code)
            } else {
              console.error('获取微信code失败', res)
              resolve(null)
            }
          }
        )
      })
    })
  }
  
  // 清除登录状态
  const clearAuth = () => {
    localStorage.removeItem('token')
    userInfo.value = null
    isLogin.value = false
  }
  
  // 退出登录
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout')
    } finally {
      clearAuth()
      router.replace('/')
    }
  }
  
  return {
    userInfo,
    isLogin,
    checkLogin,
    wechatLogin,
    logout
  }
}