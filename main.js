import App from './App'

// #ifndef VUE3
import Vue from 'vue'
Vue.config.productionTip = false
Vue.prototype.checkLogin = function(backpage, backtype){
	var SUID  = uni.getStorageSync('SUID');
	var SRAND = uni.getStorageSync('SRAND');
	var SNAME = uni.getStorageSync('SNAME');
	var SFACE = uni.getStorageSync('SFACE');
	if(SUID == '' || SRAND == '' || SFACE == ''){
		uni.redirectTo({url:'../login/login?backpage='+backpage+'&backtype='+backtype});
		return false;
	}
	return [SUID, SRAND, SNAME, SFACE];
}
// 定义全局APi 接口地址及token
const APITOKEN = 'api2018'


Vue.prototype.apiServer    = 'https://www.dandan.link/index.php?token='+APITOKEN+'&c=';
Vue.prototype.staticServer = 'https://www.dandan.link/';
const appid = 'wxc053d04b0e3a34c8'
const secret = 'd004ae629847df3e7eb7d770aefa485d'
App.mpType = 'app'
const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif