<template>
  <div class="cropper-wrap" v-show="visible" ref="wrap">
    <div class="cropper-view"
      :class="{ unmovable: !movable }"
      :style="{
        width: w + 'px',
        height: h + 'px',
        top: y + 'px',
        left: x + 'px',
        borderColor: borderColor,
        color: modalColor
      }"
      @mousedown="moveStart"
      ref="view">
      <span v-if="resizable">
        <span class="cropper-line line-top" @mousedown.stop="resizeStart($event, false, true, 0, 1)"></span>
        <span class="cropper-line line-left" @mousedown.stop="resizeStart($event, true, false, 1, 0)"></span>
        <span class="cropper-line line-bottom" @mousedown.stop="resizeStart($event, false, true, 0, 2)"></span>
        <span class="cropper-line line-right" @mousedown.stop="resizeStart($event, true, false, 2, 0)"></span>
        <span class="cropper-point point1" :style="{backgroundColor: pointColor}" @mousedown.stop="resizeStart($event, true, true, 1, 1)"></span>
        <span class="cropper-point point2" :style="{backgroundColor: pointColor}" @mousedown.stop="resizeStart($event, true, true, 2, 1)"></span>
        <span class="cropper-point point3" :style="{backgroundColor: pointColor}" @mousedown.stop="resizeStart($event, true, true, 1, 2)"></span>
        <span class="cropper-point point4" :style="{backgroundColor: pointColor}" @mousedown.stop="resizeStart($event, true, true, 2, 2)"></span>
      </span>
      <span v-if="showInfo" class="cropper-info" :style="infoStyle">
        {{ w > 0 ? Math.round(w) : 0 }} × {{ h > 0 ? Math.round(h) : 0 }}
      </span>
      <span v-if="showTool" class="cropper-tool" :class="{'resizing':isResizing}" :style="toolStyle">
        <span class="cropper-close"
          v-if="showClose"
          :style="{color: closeColor}"
          @mousedown.stop="close">
        </span>
        <span class="cropper-confirm" 
          :style="{color: confirmColor}"
          @mousedown.stop="confirm">
        </span>
      </span>
    </div>
  </div>
</template>

<script>
import throttle from 'lodash/throttle'
import { isPNum } from '../utils/util.js'

const defaultWidth = 40
const defaultHeight = 40

export default {
  name: 'CropRegion',
  data() {
    return {
      wrapper: null, // 容器dom
      visible: false, // 框体是否可见
      // Size
      w: 0, // 框体宽度
      h: 0, // 框体高度
      // Position
      x: 0, // 框体水平方向位置
      y: 0, // 框体垂直方向位置
      // Move
      isMoving: false, //是否正在移动
      mx: 0, // 框体移动时的鼠标位置x
      my: 0, // 框体移动时的鼠标位置y
      // Resize
      isResizing: false, // 是否正在改变尺寸
      canResizeX: false, // 水平方向可改变尺寸
      canResizeY: false, // 垂直方向可改变尺寸
      targetTypeX: 1, // 水平方向改变尺寸时，拖动的目标类型。1：左边， 2：右边
      targetTypeY: 1, // 垂直方向改变尺寸时，拖动的目标类型。1：顶部， 2：底部
      mxOnResize: 0, // 开始resize时，鼠标位置x
      myOnResize: 0, // 开始resize时，鼠标位置y
      wOnResize: 0, // 开始resize时, 框体宽度
      hOnResize: 0, // 开始resize时, 框体高度
      xOnResize: 0, // 开始resize时, 框体水平方向位置
      yOnResize: 0,  // 开始resize时, 框体垂直方向位置
    }
  },
  props: {
    borderColor: { type: String, default: '#409EFF'}, // 框体边框颜色  
    modalColor: { type: String, default: 'rgba(0, 0, 0, 0.5)'},
    pointColor: { type: String, default: '#409EFF'}, // 框体四角点的颜色
    confirmColor: { type: String, default: '#409EFF'}, 
    closeColor: { type: String, default: '#606266'},
    movable: { type: Boolean, default: true }, // 框体是否可移动
    resizable: { type: Boolean, default: true }, // 框体是否可改变大小
    showInfo: { type: Boolean, default: true }, // 是否显示info
    showTool: { type: Boolean, default: true }, // 是否显示tool
    showClose: { type: Boolean, default: true }, // 是否显示tool中的关闭按钮
    closeOnConfirm: { type: Boolean, default: false }, // 是否在确认时关闭窗体
  },
  computed: {
    infoStyle () {
      const width = 65
      const obj = { width: width + 'px' }
      obj.top = this.y > 21 ? '-21px' : '0px'

      const wh = this.wrapper && this.wrapper.offsetHeight || Number.MAX_SAFE_INTEGER
      const ww = this.wrapper && this.wrapper.offsetWidth || Number.MAX_SAFE_INTEGER
      if (this.x + width >= ww) {
        obj.right = '0px'
      } else {
        obj.left = '0px'
      }

      return obj
    },
    toolStyle () {
      const width = this.showClose ? 40 : 20
      const obj = { width: width + 'px' }

      const wh = this.wrapper && this.wrapper.offsetHeight || Number.MAX_SAFE_INTEGER
      const ww = this.wrapper && this.wrapper.offsetWidth || Number.MAX_SAFE_INTEGER
      if (this.y + this.h + 25 >= wh) {
        obj.top = this.y > 21 ? '-21px' : '0px'
      } else {
        obj.bottom = '-25px'
      }
      if (this.x + width >= ww) {
        obj.right = '0px'
      } else {
        obj.left = '0px'
      }

      return obj
    }
  },
  mounted () {
    this.wrapper = this.$refs.wrap

    this.confirmPosition = throttle((e) => {
      const wh = this.wrapper.offsetHeight
      const ww = this.wrapper.offsetWidth
      let newX = this.x + e.clientX - this.mx
      let newY = this.y + e.clientY - this.my

      if (newX < 0) {
        newX = 0
      } else if (newX > (ww - this.w)) {
        newX = ww - this.w
      }
      if (newY < 0) {
        newY = 0
      } else if (newY > (wh - this.h)) {
        newY = wh - this.h
      }
      this.x = newX
      this.y = newY

      this.mx = e.clientX
      this.my = e.clientY
    }, 50)

    this.resizeWrapper = throttle((e) => {
      this.handleResize(e)
    }, 50)
  },
  beforeDestroy () {
    this.clear()
    this.wrapper = null
    this.visible = false
    this.isMoving = false
    this.isResizing = false
    this.confirmPosition = null
    this.resizeWrapper = null
    window.removeEventListener('mousemove', this.moving)
    window.removeEventListener('mouseup', this.moveStop)
    window.removeEventListener('mousemove', this.resizing)
    window.removeEventListener('mouseup', this.resizeStop)
  },
  methods: {
    // 清空变量值
    clear () {
      this.w = 0
      this.h = 0
      this.x = 0
      this.y = 0
    },
    // 展示框体，可自定义大小、位置
    show (options) {
      options = (options && typeof options === 'object') ? options : {}
      this.visible = true

      setTimeout(() => {
        this.w = defaultWidth
        this.h = defaultHeight
        this.x = 0
        this.y = 0
        isPNum(options.x) ? this.x = options.x : ''
        isPNum(options.y) ? this.y = options.y : ''
        isPNum(options.w) ? this.w = options.w : ''
        isPNum(options.h) ? this.h = options.h : ''

        const wh = this.wrapper.offsetHeight
        const ww = this.wrapper.offsetWidth
        this.w > ww ? this.w = ww : ''
        this.h > wh ? this.h = wh : ''
        this.x > (ww - this.w) ? this.x = ww - this.w : ''
        this.y > (wh - this.h) ? this.y = wh - this.h : ''
      }, 10)
    },
    // 隐藏框体。isClear：是否清空变量值
    close (isClear = true) {
      this.visible = false
      this.$emit('close', this.getAxis())
      isClear ? this.clear() : ''
    },
    confirm () {
      this.$emit('confirm', this.getAxis())
      this.closeOnConfirm ? this.close() : ''
    },
    // 获取当前框体所在位置 {x1, x2, y1, y2}
    getAxis () {
      return {
        x1: this.x,
        x2: this.x + this.w,
        y1: this.y,
        y2: this.y + this.h
      }
    },
    // 开始移动框体
    moveStart (e) {
      e.preventDefault()
      if (!this.movable) return

      this.isMoving = true
      window.addEventListener('mousemove', this.moving)
      window.addEventListener('mouseup', this.moveStop)
      this.refreshPosition(e)
    },
    // 移动中
    moving (e) {
      e.preventDefault()
      if (!this.isMoving) return
      this.confirmPosition(e)
    },
    // 停止移动框体
    moveStop (e) {
      this.isMoving = false
      window.removeEventListener('mousemove', this.moving)
      window.removeEventListener('mouseup', this.moveStop)
    },
    // 刷新鼠标位置
    refreshPosition (e) {
      this.mx = e.clientX
      this.my = e.clientY
    },
    // 开始改变框体大小
    resizeStart (e, canResizeX, canResizeY, typeX, typeY) {
      e.preventDefault()
      this.isResizing = true
      window.addEventListener('mousemove', this.resizing)
      window.addEventListener('mouseup', this.resizeStop)

      this.canResizeX = canResizeX
      this.canResizeY = canResizeY
      this.targetTypeX = typeX
      this.targetTypeY = typeY
      this.mxOnResize = e.clientX 
      this.myOnResize = e.clientY

      this.wOnResize = this.w
      this.hOnResize = this.h
      this.xOnResize = this.x
      this.yOnResize = this.y
    },
    // 正在改变框体大小
    resizing (e) {
      e.preventDefault()
      if (!this.isResizing) return
      this.resizeWrapper(e)
    },
    handleResize (e) {
      const wh = this.wrapper.offsetHeight
      const ww = this.wrapper.offsetWidth
      const mx = e.clientX
      const my = e.clientY
      // 鼠标移动的增量
      const dmx = mx - this.mxOnResize
      const dmy = my - this.myOnResize

      if (this.canResizeX) {
        if (this.targetTypeX === 1) {
          // 左边框向右移动，且左边框没有越过右边框时; 左边框向左移动时；
          if (this.wOnResize - dmx > 0) {
            if (this.xOnResize + dmx >= 0) {
              // 向左没有超过容器边界时；向右时；
              this.w = this.wOnResize - dmx
              this.x = this.xOnResize + dmx
            } else {
              // 向左超出容器边界时
              this.w = this.wOnResize + this.xOnResize
              this.x = 0
            }
          }
          // 左边框向右移动，且左边框越过了右边框
          else {
            // 右边框成为左边框，x为原右边框的水平位置(x2)
            // 超出容器右边界时，框体(新)右边框位置为容器有边界处
            const _dmx = Math.abs(dmx)
            this.x = this.xOnResize + this.wOnResize
            this.w = (_dmx + this.xOnResize) <= ww ? _dmx - this.wOnResize : ww - this.wOnResize - this.xOnResize
          }
        } else if (this.targetTypeX === 2) {
          // 右边框向左移动，且右边框没有越过左边框时；右边框向右移动时
          if (this.wOnResize + dmx > 0) {
            this.x = this.xOnResize
            this.w = (this.wOnResize + dmx + this.xOnResize) <= ww ? this.wOnResize + dmx : ww - this.xOnResize 
          }
          // 右边框向左移动，且右边框越过了左边框时
          else {
            const exceededX = Math.abs(dmx + this.wOnResize)
            if (exceededX <= this.xOnResize) {
              this.x = this.xOnResize - exceededX
              this.w = exceededX
            } else {
              this.x = 0
              this.w = this.xOnResize
            }
          }
        }
      }

      if (this.canResizeY) {
        if (this.targetTypeY === 1) {
          // 顶边框向下移动，且没有越过底边框；顶边框向上移动；
          if (this.hOnResize - dmy > 0) {
            if (this.yOnResize + dmy >= 0) {
              // 向上没有超过容器边界时; 向下时；
              this.h = this.hOnResize - dmy
              this.y = this.yOnResize + dmy
            } else {
              // 向上超过容器边界时
              this.h = this.hOnResize + this.yOnResize
              this.y = 0
            }
          } 
          // 顶边框向下移动，且越过底边框时
          else {
            const _dmy = Math.abs(dmy)
            this.y = this.yOnResize + this.hOnResize
            this.h = (_dmy + this.yOnResize <= wh) ? _dmy - this.hOnResize : wh - this.hOnResize - this.yOnResize
          }
        } else if (this.targetTypeY === 2) {
          // 底边框向上移动，且没有越过顶边框时；底边框向下移动时
          if (this.hOnResize + dmy > 0) {
            this.y = this.yOnResize
            this.h = (this.hOnResize + dmy + this.yOnResize) <= wh ? this.hOnResize + dmy : wh - this.yOnResize
          }
          // 底边框向上移动，且越过顶边框时;
          else {
            const exceededY = Math.abs(dmy + this.hOnResize)
            if (exceededY <= this.yOnResize) {
              this.y = this.yOnResize - exceededY
              this.h = exceededY
            } else {
              this.y = 0
              this.h = this.yOnResize
            }
          }
        }
      }
    },
    // 停止改变框体大小
    resizeStop (e) {
      this.isResizing = false
      window.removeEventListener('mousemove', this.resizing)
      window.removeEventListener('mouseup', this.resizeStop)
    }
  }
}
</script>

<style scoped>
.cropper-wrap,
.cropper-view {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
.cropper-wrap {
  overflow: hidden;
  background-color: transparent;
}
.cropper-view {
  background: transparent;
  border: 1px solid #409eff;
  cursor: move;
  color: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 0 5000px;
}
.cropper-view.unmovable{
  cursor: auto;
}

.cropper-info {
  position: absolute;
  width: 65px;
  text-align: center;
  color: #FFFFFF;
  line-height: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  font-size: 12px;
  z-index: 1000;
}

.cropper-tool{
  position: absolute;
  width: 40px;
  height: 20px;
  padding: 0px;
  line-height: 20px;
  box-sizing: border-box;
  font-size: 0;
  font-weight: 400;
  background-color: #FFFFFF;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
  cursor: auto;
  overflow: hidden;
  opacity: 1;
  z-index: 1001;
}
.cropper-tool.resizing{
  opacity: 0;
}
.cropper-confirm{
  color: #409eff;
  display: inline-block;
  outline: 0;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  width: 20px;
}
.cropper-confirm:before {
  content: '\2714';
}
.cropper-close{
  color: #606266;
  outline: 0;
  display: inline-block;
  cursor: pointer;
  text-align: center;
  font-size: 13px;
  width: 20px;
}
.cropper-close:before {
  content: '\2716';
}
.cropper-confirm:hover,
.cropper-close:hover{
  background-color: #EAEAEA;
}

.cropper-line {
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  z-index: 1002;
}
.line-top {
  top: -3px;
  left: 0;
  height: 5px;
  cursor: n-resize;
}
.line-left {
  top: 0;
  left: -3px;
  width: 5px;
  cursor: w-resize;
}
.line-bottom {
  bottom: -3px;
  left: 0;
  height: 5px;
  cursor: s-resize;
}
.line-right {
  top: 0;
  right: -3px;
  width: 5px;
  cursor: e-resize;
}

.cropper-point{
  position: absolute;
  width: 8px;
  height: 8px;
  opacity: 0.7;
  background-color: #409eff;
  z-index: 1003;
}
.cropper-point.point1 {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}
.cropper-point.point2 {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}
.cropper-point.point3 {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}
.cropper-point.point4 {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}
</style>