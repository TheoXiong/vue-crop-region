import Vue from 'vue'
import App from './App.vue'
import './assets/css/flex.css'

import CropRegion from '../../src/index.js'

Vue.use(CropRegion)

Vue.config.productionTip = false

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  render: h => h(App)
})
