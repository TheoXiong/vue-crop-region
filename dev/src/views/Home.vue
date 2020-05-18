<template>
  <div class="home">
    <header>
      <nav-menu></nav-menu>
    </header>
    <aside>
      <vue-button class="aside-btns" size="mini" @click="show">Show</vue-button>
      <vue-button class="aside-btns" size="mini" @click="close">Close</vue-button>
      <div class="aside-line"></div>
      <vue-button class="aside-btns" size="mini" @click="changeTheme">Change Theme</vue-button>
      <vue-button class="aside-btns" size="mini" @click="changeModalColor">Modal Color</vue-button>
      <div class="aside-line"></div>
      <vue-button class="aside-btns" size="mini" @click="toggleMove">Toggle Move</vue-button>
      <vue-button class="aside-btns" size="mini" @click="toggleResize">Toggle Resize</vue-button>
      <vue-button class="aside-btns" size="mini" @click="toggleInfo">Toggle Info</vue-button>
      <vue-button class="aside-btns" size="mini" @click="toggleTool">Toggle Tool</vue-button>
    </aside>
    <section id="wrapper">
      <canvas id="canvas"></canvas>
      <CropRegion
        :border-color="borderColor"
        :point-color="pointColor"
        :confirm-color="confirmColor"
        :modal-color="modalColor"
        :movable="movable"
        :resizable="resizable"
        :show-info="showInfo"
        :show-tool="showTool"
        @confirm="onConfirm"
        @close="onClose"
        ref="cropper">
      </CropRegion>
    </section>
    <vue-msg :timeout="2000" :top="100" :right="20" ref="vueMsg"></vue-msg>
  </div>
</template>

<script>
import NavMenu from './NavMenu.vue'
import VueButton from './VueButton.vue'
import VueMsg from 'vue-msgs'

const themeColors = ['#409EFF', '#67c23a', '#f56c6c', '#b10dc9', '#000000']

const randomColor = (min = 0, max = 255, alpha = false) => {
  let r = Math.floor(Math.random() * (max - min) + min)
  let g = Math.floor(Math.random() * (max - min) + min)
  let b = Math.floor(Math.random() * (max - min) + min)
  
  if (alpha) {
    let a = Math.floor(Math.random() * 10) / 10
    return `rgba(${r}, ${g}, ${b}, ${a})`
  } else {
    return `rgb(${r}, ${g}, ${b})`
  }
}

export default {
  name: 'Home',
  data() {
    return {
      borderColor: '#409EFF',
      pointColor: '#409EFF',
      confirmColor: '#409EFF',
      themeCnt: 0,
      modalColor: 'rgba(0, 0, 0, 0.5)',
      movable: true,
      resizable: true,
      showInfo: true,
      showTool: true
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    init () {
      const wrapper = document.querySelector('#wrapper')
      const canvas = document.querySelector('#canvas')
      const width = wrapper.offsetWidth
      const height = wrapper.offsetHeight
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      const count = 500
      for (let i = 0; i < count; i++) {
        const x = Math.floor(Math.random() * width)
        const y = Math.floor(Math.random() * height)
        const r = Math.floor(Math.random() * 8)

        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        ctx.fillStyle = randomColor(0, 255, true)
        ctx.fill()
      }
    },
    show () {
      this.$refs.cropper.show({
        x: Math.floor(Math.random() * 300),
        y: Math.floor(Math.random() * 300),
        w: 160,
        h: 160
      })
    },
    close () {
      this.$refs.cropper.close()
    },
    changeTheme () {
      this.themeCnt++
      if (this.themeCnt > 4) {
        this.themeCnt = 0
      }
      let color = themeColors[this.themeCnt]
      this.borderColor = color
      this.pointColor = color
      this.confirmColor = color
    },
    changeModalColor () {
      let alpha = Math.floor(Math.random() * 10) / 10
      this.modalColor = `rgba(0, 0, 0, ${alpha})`
    },
    toggleMove () {
      this.movable = !this.movable
    },
    toggleResize () {
      this.resizable = !this.resizable
    },
    toggleInfo () {
      this.showInfo = !this.showInfo
    },
    toggleTool () {
      this.showTool = !this.showTool
    },
    onConfirm (axis) {
      console.log('confirmed: ', axis)
      this.showMsg('success', `Confirmed: x1=${axis.x1}, y1=${axis.y1}, x2=${axis.x2}, y2=${axis.y2}`)
    },
    onClose (axis) {
      console.log('closed: ', axis)
      this.showMsg('info', `Closed: x1=${axis.x1}, y1=${axis.y1}, x2=${axis.x2}, y2=${axis.y2}`)
    },
    // 消息弹框 type：success/info/warning/error
    showMsg (type, info) {
      if (this.$refs && this.$refs.vueMsg && typeof this.$refs.vueMsg.showMsg === 'function') {
        this.$refs.vueMsg.showMsg(type, info)
      }
    }
  },
  components: { NavMenu, VueButton, VueMsg }
}
</script>

<style lang="scss" scoped>
.home{
  height: 100%;
  width: 100%;
  min-width: 500px;
  position: relative;
  header {
    width: 100%;
    height: 70px;
  }
  aside{
    position: absolute;
    top: 70px;
    bottom: 0;
    left: 0;
    width: 200px;
    padding: 30px;
    background-color: rgb(33,37,43);
    border-right: 1px solid rgb(33,37,43);
    box-sizing: border-box;
    overflow-y: auto;
    .aside-btns{
      display: block;
      width: 100%;
      margin-top: 12px;
      font-size: 12px;
      font-family: Arial;
    }
    .aside-line{
      display: block;
      width: calc(100% + 10px);
      margin: 12px -5px 6px -5px;
      border-bottom: 1px solid rgb(127, 130, 139);
    }
  }
  section {
    position: absolute;
    top: 70px;
    bottom: 0px;
    left: 200px;
    right: 0px;
    padding: 0px;
    box-sizing: border-box;
  }
  #canvas{
    width: 100%;
    height: 100%;
  }
}

</style>