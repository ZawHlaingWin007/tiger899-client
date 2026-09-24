import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import store from './store'
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'
import 'vant/lib/index.css'

import {
  Empty,
  Field,
  Uploader,
  Button,
  Form,
  Popup,
  Picker,
  Dialog,
  Icon,
  CellGroup,
  Overlay,
  Swipe,
  SwipeItem,
} from 'vant';

// Use English for Vant components (Calendar weekdays, Start/End, month format, etc.)
Locale.use('en-US', enUS)


// Set the base URL for Axios
// 
window.axios = axios;

// axios.defaults.baseURL = 'https://back.samurai81.net/api/';
// axios.defaults.baseURL = 'https://back.shwespin777.com/api/';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// axios.defaults.baseURL = 'http://localhost:8000/api/';
// axios.defaults.baseURL = 'http://tiger899-api.test/api/';
axios.defaults.baseURL = 'https://api.tiger899.club/api/';
// 
const authToken = localStorage.getItem('token');
if (authToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
}

import { formatAmount } from "./composables/useFormatAmount.js";
import { updateSeoBaseUrl } from "./utils/seoBaseUrl.js";
import { initPwaInstall } from "./composables/usePwaInstall.js";

initPwaInstall();

const app = createApp(App);
app.use(router);
app.use(store);

app.use(Empty);
app.use(Field);
app.use(Uploader);
app.use(Button);
app.use(Form);
app.use(Popup);
app.use(Picker);
app.use(Dialog);
app.use(Icon);
app.use(CellGroup);
app.use(Overlay);
app.use(Swipe);
app.use(SwipeItem);

app.config.globalProperties.$formatAmount = formatAmount;
app.mount("#app");

// SEO: set canonical, OG, Twitter, hreflang and JSON-LD to current domain (tiger899.com / yu95.net / yu95.vip / future)
updateSeoBaseUrl();
