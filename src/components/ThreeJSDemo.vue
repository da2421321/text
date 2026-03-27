<template>
  <div class="threejs-container">
    <div ref="threeContainer" class="threejs-canvas"></div>
    <div class="controls">
      <button @click="toggleRotation" class="control-btn">
        {{ isRotating ? '停止旋转' : '开始旋转' }}
      </button>
      <button @click="resetCamera" class="control-btn">
        重置视角
      </button>
      <button @click="changeGeometry" class="control-btn">
        切换形状
      </button>
    </div>
  </div>
</template>

<script setup>
import * as THREE from 'three'
import { onMounted, onUnmounted, ref } from 'vue'

const threeContainer = ref(null)
let scene, camera, renderer, cube, animationId
let isRotating = ref(true)
let geometries = ['box', 'sphere', 'cylinder']
let currentGeometryIndex = 0

onMounted(() => {
  initThreeJS()
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
})

const initThreeJS = () => {
  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    threeContainer.value.clientWidth / threeContainer.value.clientHeight,
    0.1,
    1000
  )
  camera.position.z = 5

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  threeContainer.value.appendChild(renderer.domElement)

  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
  scene.add(ambientLight)

  // 添加方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 5, 5)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  // 创建几何体
  createGeometry()

  // 添加网格地面
  const gridHelper = new THREE.GridHelper(10, 10)
  scene.add(gridHelper)

  // 添加坐标轴
  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  // 鼠标控制
  const controls = {
    mouseX: 0,
    mouseY: 0,
    mouseDown: false
  }

  const onMouseMove = (event) => {
    const rect = renderer.domElement.getBoundingClientRect()
    controls.mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    controls.mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  const onMouseDown = () => {
    controls.mouseDown = true
  }

  const onMouseUp = () => {
    controls.mouseDown = false
  }

  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mouseup', onMouseUp)

  // 响应窗口大小变化
  const onWindowResize = () => {
    camera.aspect = threeContainer.value.clientWidth / threeContainer.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight)
  }

  window.addEventListener('resize', onWindowResize)
}

const createGeometry = () => {
  // 移除旧的几何体
  if (cube) {
    scene.remove(cube)
  }

  let geometry
  const material = new THREE.MeshLambertMaterial({
    color: Math.random() * 0xffffff,
    transparent: true,
    opacity: 0.8
  })

  switch (geometries[currentGeometryIndex]) {
    case 'box':
      geometry = new THREE.BoxGeometry(2, 2, 2)
      break
    case 'sphere':
      geometry = new THREE.SphereGeometry(1.5, 32, 32)
      break
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(1, 1, 2, 32)
      break
  }

  cube = new THREE.Mesh(geometry, material)
  cube.castShadow = true
  cube.receiveShadow = true
  scene.add(cube)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (isRotating.value && cube) {
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
  }

  renderer.render(scene, camera)
}

const toggleRotation = () => {
  isRotating.value = !isRotating.value
}

const resetCamera = () => {
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)
}

const changeGeometry = () => {
  currentGeometryIndex = (currentGeometryIndex + 1) % geometries.length
  createGeometry()
}
</script>

<style scoped>
.threejs-container {
  width: 100%;
  height: 600px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.threejs-canvas {
  width: 100%;
  height: 100%;
}

.controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

.control-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.control-btn:active {
  transform: translateY(0);
}
</style>
