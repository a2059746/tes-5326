import { MinSensorTimeout } from './../../providers/settings/settings';
import { Subject } from 'rxjs/Subject';
import { Network } from '@ionic-native/network';
import { Component, EventEmitter, ViewChild } from '@angular/core';
import { IonicPage, LoadingController, NavController, PopoverController, Platform, AlertController, ViewController, Slides } from 'ionic-angular';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/repeat';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/zip';
import 'rxjs/add/operator/delay';

import { ISubscription, Subscription } from 'rxjs/Subscription';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { SettingsProvider } from '../../providers/settings/settings';
import { PopoverPage } from '../popover/popover';
import { MediaObject } from '@ionic-native/media';
const DELAY_START_CONNECTING = 1500;
const NETWORK_TIMEOUT = 13000;
const ENG_DESC_TOP = '13px'
interface SensorType {
  _time?: number,
  mode?: number,
  weight?: number,
  alm_mode?: boolean,
  battery?: number,
  max?: any,
  min?: any,
  spl?: any,

  alm_toggle?: boolean,
  weightingLabel?: string,
}

const _DEFAULT_DATA: SensorType = {
  mode: 0,
  weight: 0,
  alm_mode: false,
  battery: 5,
  max: '---',
  min: '---',
  spl: '---',

  alm_toggle: false,
  weightingLabel: "Z",
}
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  sensor: SensorType = {
    _time: null,
    mode: 0,
    weight: 0,
    alm_mode: false,
    battery: 5,
    max: '---',
    min: '---',
    spl: '---',

    alm_toggle: false,
    weightingLabel: "Z",
  }
  private alarmMedia: MediaObject;
  desc_top: string = ENG_DESC_TOP;
  currentlang: string = '繁中';
  refreshEvent: EventEmitter<boolean>;
  refreshEvent$: ISubscription = null;
  private ngUnsubscribe = new Subject();
  @ViewChild(Slides) slides: Slides;
  constructor(
    private http: HttpClient,
    public translate: TranslateService,
    public loadingCtrl: LoadingController,
    private settings: SettingsProvider,
    private alertCtrl: AlertController,
    private platform: Platform,
    public popoverCtrl: PopoverController,
    public navCtrl: NavController,
    private network: Network,
  ) {
    this.platform.ready().then(res => {
      this.currentlang = (this.translate.currentLang == 'en')?'English':'繁中';
      this.desc_top = (this.translate.currentLang == 'en')?ENG_DESC_TOP:'3px';
      this.airtext = 'WAIT_NETWORK';
      this.onLangChange = this.translate.onLangChange.subscribe((params) => {
        this.currentlang = (this.translate.currentLang == 'en')?'English':'繁中';
        this.desc_top = (this.translate.currentLang == 'en')?ENG_DESC_TOP:'3px';
      })
      this.startClock();
    });

  }
  onLangChange: any = null;
  isLoading: boolean = true;
  loading: any = null;
  hasMac: any = false;
  isInited = false;
  refreshMain(refresh = true, timedelay = 500 ) {
    console.log('hi')
    this.removeTimeoutNW(); // 網路逾時
    this.rmAllDataSubs(); // 資料更新
    this.addDataTimeout(null, false);  // 資料有不有效
    this.rmConnSubs();  // SERVER 連線
    if(refresh) {
      this.startConnect(timedelay);   // 主連接進入點
    }
  }

  currentSlide: number = null;
  refreshingTimeOut: any = null;
  slideChanged() {
    clearTimeout(this.refreshingTimeOut);
    this.currentSlide = this.slides.getActiveIndex();

    let currentMac = this.macList[this.currentSlide];
    console.log(currentMac['macName'])
    this.refreshingTimeOut = setTimeout(() => {
      this.slides.slideTo(this.currentSlide);
      this.slides.lockSwipes(true); // lock slide and wait for loading (A-LOCK)
      this.settings.updateState({
        mac: currentMac['mac'],
        macName: currentMac['macName'],
        machineType: currentMac['type']
      }).then( state => {
          console.log(state.macName)
          console.log(state.machineType)
          this.hasMac = state.mac
          console.log('hasMac:' + this.hasMac)
          this.refreshMain(true)
      })
    }, 650);
  }

  /* fix bug : screen becoming half when draging and tap on the screen */
  dragTimeOut: any = null;
  log($e) {
    console.log($e);
    console.log(this.currentSlide)
    if($e == 'ionSlideWillChange') clearTimeout(this.dragTimeOut);
    if($e == 'ionSlideDrag') {
      clearTimeout(this.dragTimeOut)
      this.dragTimeOut = setTimeout(() => {
        this.slides.slideTo(this.currentSlide);
      }, 200);
    }
  }
  /********************************************************************/

  ionViewDidEnter() {
    /* slids */
    this.slides.lockSwipeToPrev(true)
    if(this.slides.length() == 1) this.slides.lockSwipeToNext(true)
    /*********/

    this.didRechecked = false;
    if(this.isInited) {
      this.refreshMain();
    }
    this.platform.pause
      .takeUntil(this.ngUnsubscribe)
      .subscribe(pause => {
        // console.log('=== SYSTEM PAUSE ===');
        this.refreshMain(false);
      })
    this.platform.resume
      .takeUntil(this.ngUnsubscribe)
      .subscribe(resume => {
        // console.log('=== SYSTEM RESUME ===');
        this.refreshMain(true);
      });
  }
  macList: Array<{}> = [];
  ionViewDidLoad() {
    this.showloading();
    this.settings.getState().take(1).subscribe(state => {  // 從Setting 拿 mac address
      if(state.mac) {
        this.macList = state.macHistories;
        this.hasMac = state.mac;
        this.startConnect();
        this.onRefreshInit();
        setTimeout(() => {  // 有點特殊，頁面切換之間容易產生 BUG
          this.isInited = true;
        }, 5000);
      } else {
        this.dismissloading();
        this.translate.get(['警告' , 'PLS_INSERT_MAC', '確認'])
        .subscribe(i18n => {
          let alert = this.alertCtrl.create({
            title: i18n['警告'],
            subTitle: i18n['PLS_INSERT_MAC'],
            buttons: [{
              text: i18n['確認'],
              role: 'cancel',
              handler: () => {
                this.navCtrl.setRoot('MacPage');
              }
            }]
          }).present();
        });
      }
    });
  }
  ionViewWillLeave() {
    if (this.settings.isAlarming) {
      this.settings.stopAlarmSound(this.alarmMedia);
      this.settings.isAlarming = false;
    }
    if(this.alarmSub$){
      this.alarmSub$.unsubscribe();
    }
    this.removeTimeoutNW();
    this.refreshMain(false);
    this.ngUnsubscribe.next(true);
    this.ngUnsubscribe.complete();
  }
  ionViewWillUnload() {
    this.refreshMain(false);
    this.clearClock();
    // this.settings.audioStop(_ALARM_ID);
    if(this.refreshEvent$) {
      this.refreshEvent$.unsubscribe();
    }
    if(this.onLangChange) this.onLangChange.unsubscribe();
  }
  connSubs$: ISubscription = null;  // Firebase connect Subs
  startConnect(delay = DELAY_START_CONNECTING) {
    setTimeout(() => {  // 避免速度比較慢的機器所以延後做連接 (非同步處理擺後面)
      this.timeoutNetwork = setTimeout(() => {
        this.errorNetworkAlert();
      }, NETWORK_TIMEOUT);  // 網路正不正常，逾時
      this.rmConnSubs();  // 清掉與SERVER訂閱的資料連接
      this.planBFirewatch();
    }, delay);
  }
  // IMPORTANT 逾時
  timeoutNetwork: any = null;

  removeTimeoutNW() {  // 只要接受到 DATA 瞬間要清掉 timeoutitem
    if(this.timeoutNetwork) {
      clearTimeout(this.timeoutNetwork);
      this.timeoutNetwork = null;
      // TODO 移除所有subscribe
      // this.rmAllDataSubs();
    }
  }
  onRefreshInit() {
    this.refreshEvent = this.settings.refreshEvent;
    if(this.refreshEvent$) {
      this.refreshEvent$.unsubscribe();
      this.refreshEvent$ = null;
    }
    this.refreshEvent$ = this.refreshEvent
      // .takeUntil(this.ngUnsubscribe)
      .subscribe(refrsh => {
        if(this.hasMac) {
          // this.startConnect(300);
          this.refreshMain(true);
        }
      });
  }
  timeoutsArr: Array<any> = [];
  subs$: ISubscription = null;
  macError() {
    this.settings.rmMacHistory(this.hasMac);
    this.defaultDatas(-9999);
    this.translate.get(['錯誤' , 'ERROR_NO_MAC', '確認'])
    .subscribe(i18n => {
      let alert = this.alertCtrl.create({
        title: i18n['錯誤'],
        subTitle: i18n['ERROR_NO_MAC'],
        buttons: [
          {
            text: i18n['確認'],
            role: 'cancel',
            handler: () => {
              this.navCtrl.setRoot('MacPage');
            }
          }
        ]
      });
      alert.present();
    });
  }
  showloading() {
    if(!this.loading) {
      this.loading = this.loadingCtrl.create({
        content: 'Please wait...'
      });
      this.loading.present();
    }
  }
  dismissloading() {
    if (this.loading) {
      this.loading.dismiss();
      this.loading = null;
    }
  }
  /**/
  defaultDatas(s = -9999) {
    this.sensor = Object.assign(this.sensor, _DEFAULT_DATA);
    //this.sensor.pm = this.pm25Render(s);
  }
  dataTimeout: any = null;
  addDataTimeout(t, add = true) {
    if (this.dataTimeout) {
      clearTimeout(this.dataTimeout);
    }
    if(add) {
      this.dataTimeout = t;
    }
    /* for(let i = 0; i < this.timeoutsArr.length; i++) {
      clearTimeout(this.timeoutsArr[i]);
    }
    this.timeoutsArr = [];
    this.timeoutsArr.push(t); */
  }

  hasClickToggle: boolean = false;
  sensorRender(datas: SensorType) {

    /* SPL Value Control */
    datas.spl = Number.parseFloat(datas.spl).toFixed(1);

    /* A/C/Z weighting state */
    if(datas.weight == 0) {
      datas.weightingLabel = "A"
    } else if(datas.weight ==1) {
      datas.weightingLabel = "C"
    } else if(datas.weight ==2) {
      datas.weightingLabel = "Z"
    }

    /* MAX Humidity */
    datas.max = Number.parseFloat(datas.max).toFixed(1);

    /* MIN */
    datas.min = Number.parseFloat(datas.min).toFixed(1);

    /* Alarm Toggle State */
    if(datas.mode == 1) {
      if(datas.alm_mode) {
        this.settings.isAlarming = true;
        if(this.hasClickToggle) {
          datas.alm_toggle = false;
        } else {
          datas.alm_toggle = true;
        }
      } else {
        datas.alm_toggle = false;
        this.hasClickToggle = false;
        this.settings.isAlarming = false;
      }
    } else {
      datas.alm_toggle = false;
      this.hasClickToggle = false;
      this.settings.isAlarming = false;
    }

    return {
      ...datas
    };

  }

  airtext: string = '';

  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage, {
      page: 'HomePage'
    });
    popover.present({
      ev: myEvent
    });
  }
  i18nPopover(myEvent) {
    let popover = this.popoverCtrl.create(I18nListPage);
    popover.present({
      ev: myEvent
    });
  }
  didShowError: boolean = false;
  planB$: ISubscription = null;
  rmAllDataSubs() {
    this.rmPlanB();
    this.rmFirewatch();
  }
  rmPlanB() {
    if(this.planB$) {
      this.planB$.unsubscribe();
      this.planB$ = null;
    }
  }
  rmFirewatch() {
    if(this.subs$) {
      this.subs$.unsubscribe();
      this.subs$ = null;
    }
  }
  rmConnSubs() {
    if(this.connSubs$) {
      this.connSubs$.unsubscribe();
      this.connSubs$ = null;
    }
  }

  isAudio = false;
  alarmSub$: Subscription = null;
  playSound(isAlarm : boolean = false) {
    return new Promise((resolve, reject) => {
      if(isAlarm && !this.isAudio) {
        this.alarmMedia = this.settings.createAlarmSound(this.settings.currentAlmUri);
        this.settings.playAlarmSound(this.alarmMedia);
        if(!this.alarmSub$) {
          this.alarmSub$ = this.settings.getAlarmStatus(this.alarmMedia).subscribe(statusCode => {
            if(statusCode == 4)
            {
              this.alarmMedia.play();
            }
          })
        }
        this.isAudio = true;
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }

  closeAlarm(isAlarm : boolean = false, e = undefined) {
    if((!isAlarm && this.isAudio)) {
      this.settings.stopAlarmSound(this.alarmMedia);
      this.alarmSub$.unsubscribe();
      this.alarmSub$ = null;
      this.sensor.alm_toggle = false;
      this.isAudio = false;
    } else if((isAlarm && this.isAudio && e)) {
      this.settings.stopAlarmSound(this.alarmMedia);
      this.alarmSub$.unsubscribe();
      this.hasClickToggle = true;
      this.alarmSub$ = null;
      this.sensor.alm_toggle = false;
      this.isAudio = false;
    } else if (e && !this.sensor.alm_toggle && this.settings.isAlarming) {
      this.sensor.alm_toggle = true;
      this.hasClickToggle = false;
      this.playSound(this.sensor.alm_toggle);
    }
  }

  planBFirewatch() {
    this.showloading();
    this.rmAllDataSubs();
    this.planB$ = this.http
    .get('http://5326.tes-app.com/api/5326/latest/' + this.hasMac) //http://5327.tes-app.com/api/53278/
    .delay(2500)
    .repeat().subscribe(scc => {
      console.log(scc)
      this.removeTimeoutNW();
      if(!scc['error']) {
        if(scc['content']) {
          if(scc['content']._time) {
            let time = scc['content']._st || new Date().getTime();
            if (scc['content']._time >= time - MinSensorTimeout) {
              this.sensor = this.sensorRender(scc['content']);
              this.playSound(this.sensor.alm_toggle).then(r => {
                this.closeAlarm(this.sensor.alm_toggle);
              });
              this.addDataTimeout(setTimeout(() => {
                this.defaultDatas(-9999);
              }, MinSensorTimeout));
            } else {
              this.defaultDatas(-9999);
              this.closeAlarm(this.sensor.alm_toggle, true);
            }
          } else {
             this.macError();
          }
        } else {
        this.macError();
        }
      } else {
        this.errorNetworkAlert(scc['code']);
      }
      this.dismissloading();
      this.slides.lockSwipes(false); // lock slide when loading disappear (A-UNLOCK)
    }, err => {
      this.errorNetworkAlert();
    });
  }
  didRechecked = false;
  retryNetwork() {
  }
  errorNetworkAlert(debug: any = false) {
    console.log('errorNetworkAlert');
    this.removeTimeoutNW();
    this.rmAllDataSubs();
    this.addDataTimeout(null, false);
    // this.dismissloading();
    this.showloading();
    if(debug) {

    }
    if(this.didRechecked) {
      this.dismissloading();
      this.alertNetworkError();
    } else {
      console.log('START ERROR NETWORK TEST')
      this.http.get('http://www.tes-app.com/',)
      .take(1)
      .subscribe(res => {
        this.dismissloading();
        if (res['code'] == 200) {
          this.didRechecked = true;
          this.startConnect(2000);
        } else {
          this.didRechecked = true;
          this.alertNetworkError();
        }
      }, err => {
        this.didRechecked = true;
        this.dismissloading();
        this.alertNetworkError();
      });
    }

    // this.rmPlanB();
  }
  alertNetworkError() {
    this.slides.lockSwipes(true); // lock slide when alert appear (B-LOCK)
    if(!this.didShowError) {
      this.didShowError = true;
      this.translate.get(['錯誤' , 'ERROR_NETWORK', '確認'])
      .subscribe(i18n => {
        let alert = this.alertCtrl.create({
          title: i18n['錯誤'],
          subTitle: i18n['ERROR_NETWORK'],
          buttons: [
            {
              text: i18n['確認'],
              role: 'cancel',
              handler: () => {
                this.slides.lockSwipes(false); // unlock slide when alert disappear (B-UNLOCK)
                this.defaultDatas(-8888);
                // this.navCtrl.setRoot('MacPage');
              }
            }
          ]
        });
        alert.present();
        alert.onDidDismiss(() => {
          this.didShowError = false;
        });
      });
    }
  }
  clock: Date = new Date();
  clock$: any = null;
  startClock() {
    this.clock$ = setInterval(() => {
      this.clock = new Date();
    }, 1000);
  }
  clearClock() {
    if(this.clock$) {
      clearInterval(this.clock$);
    }
  }
}


@Component({
  template: `
    <ion-list>
      <button ion-item (click)="chooseLang('zh-cmn-Hant')">繁體中文</button>

      <button ion-item (click)="chooseLang('en')">English</button>
<!--
<button ion-item (click)="chooseLang('zh-cmn-Hant')">简体中文</button>
<button ion-item (click)="close()">한국어</button>
<button ion-item (click)="close()">日本語</button>
<button ion-item (click)="close()">Indonesia</button>
<button ion-item (click)="close()">العربية</button>
<button ion-item (click)="close()">Türk dili</button>
<button ion-item (click)="close()">Portugues</button>
<button ion-item (click)="close()">suomalainen</button> -->
    </ion-list>
  `
})
export class I18nListPage {
  constructor(
    private platform: Platform,
    public translate: TranslateService,
    public viewCtrl: ViewController) {

    }
  chooseLang(lang: string) {
    this.platform.ready().then(() => {
      this.translate.setDefaultLang(lang);
      this.translate.use(lang);
      this.viewCtrl.dismiss();
    });
  }
  close() {
    this.viewCtrl.dismiss();
  }
}
