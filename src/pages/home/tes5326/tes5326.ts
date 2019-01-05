import { Subject } from 'rxjs/Subject';
import { Network } from '@ionic-native/network';
import { Component, EventEmitter } from '@angular/core';
import { IonicPage, LoadingController, NavController, PopoverController, ViewController, Platform, AlertController, NavParams, App } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/repeat';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/zip';
import 'rxjs/add/operator/delay';

import { ISubscription } from 'rxjs/Subscription';
import { HttpClient } from '@angular/common/http';
import { ImageViewerController } from 'ionic-img-viewer';
import { TranslateService } from '@ngx-translate/core';
// import { AngularFireDatabase } from 'angularfire2/database';
import { SettingsProvider } from '../../../providers/settings/settings';
import { I18nListPage } from '../home';
import { PopoverPage } from '../../popover/popover';
const DELAY_START_CONNECTING = 1500;
const NETWORK_TIMEOUT = 13000;
const ENG_DESC_TOP = '13px'
const MinSensorTimeout = 30000;
const AIRTEXT = [
  /* '今日空氣狀況良好',
  '今日空氣狀況普通',
  '空氣對敏感人群不良',
  '今日空氣狀況不良',
  '空氣狀況非常不良',
  '今日空氣狀況極差',*/
  '好',
  '中等',
  '對敏感人群不良',
  '不良',
  '非常不良',
  '危險',
  'ERROR_INTERNET',
  'ERROR_DEVICE_TIMEOUT',
  '請開啟風扇',
];
interface SensorType {
  _time?: number;
  alm_mode?: boolean,
  battery?: number,
  max?: any,
  min?: any,
  spl?: any,

  alm_toggle?: boolean,
}

const _DEFAULT_DATA: SensorType = {
  alm_mode: false,
  battery: 5,
  max: '---',
  min: '---',
  spl: '---',
}
@IonicPage()
@Component({
  selector: 'page-tes5326',
  templateUrl: 'tes5326.html'
})
export class Tes5326Page {
  // pm25$ = Observable.interval(1000).take(180).map(x => {return this.sensor.pm = x*5;}).repeat(100);
  // pm25$ = Observable.interval(300).take(25).map(x => x*20).repeat(100);
  // pm25$ = Observable.from([6,12,23.5,35,45,55,102.5,150,200,250,375,500,600,900])
  // .zip(Observable.interval(3000), (x) => {return this.sensor.pm = x;}).repeat(100);;
  needleRotate: string = `rotate(${-120}deg)`;  // -120 ~ 120
  // pm25: number = 0;  // 0 ~ 500
  // pm25_emogi_status =  `assets/imgs/level${1}.png`;
  // emogi_test$ = Observable.interval(3000).take(5).map(x => `assets/imgs/level${x+1}.png`).repeat(100);

  sensor: SensorType = {
    _time: null,
    alm_mode: false,
    battery: 5,
    max: '---',
    min: '---',
    spl: '---',

    alm_toggle: false,
  }

  desc_top: string = ENG_DESC_TOP;
  currentlang: string = '繁中';
  refreshEvent: EventEmitter<boolean>;
  refreshEvent$: ISubscription = null;
  private ngUnsubscribe = new Subject();
  constructor(
    private http: HttpClient,
    public translate: TranslateService,
    public loadingCtrl: LoadingController,
    private settings: SettingsProvider,
    private alertCtrl: AlertController,
    private platform: Platform,
    // private fireDB: AngularFireDatabase,
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
    this.removeTimeoutNW(); // 網路逾時
    this.rmAllDataSubs(); // 資料更新
    this.addDataTimeout(null, false);  // 資料有不有效
    this.rmConnSubs();  // SERVER 連線
    if(refresh) {
      this.startConnect(timedelay);   // 主連接進入點
    }
  }
  ionViewDidEnter() {
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
  ionViewWillLeave() {
    this.removeTimeoutNW();
    this.refreshMain(false);
    this.ngUnsubscribe.next(true);
    this.ngUnsubscribe.complete();
  }
  ionViewWillUnload() {
    this.refreshMain(false);
    this.clearClock();
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
  ionViewDidLoad() {
    this.showloading();
    this.settings.getState().take(1).subscribe(state => {  // 從Setting 拿 mac address
      console.log('=======')
      console.log(state.mac);
      if(state.mac) {
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
  timeoutsArr: Array<any> = [];
  subs$: ISubscription = null;
  fireWatch() {
    // this.showloading();
    // this.rmAllDataSubs();
    // this.subs$ = this.fireDB
    // .list('/tes/devices/',
    //   ref => ref.orderByChild('mac').equalTo(this.hasMac).limitToLast(1))
    // .valueChanges(['child_added'])
    // .subscribe(list => {
    //   this.removeTimeoutNW();
    //   if(list.length) {
    //     let item = list[0];
    //     let time = new Date().getTime();
    //     if (item['_time'] >= time - MinSensorTimeout) {
    //       this.sensor = this.sensorRender(item);
    //       this.addDataTimeout(setTimeout(() => {
    //         this.defaultDatas(-9999);
    //       }, MinSensorTimeout));
    //     } else {
    //       this.defaultDatas(-9999);
    //     }
    //   } else {
    //     this.macError();
    //   }
    //   this.dismissloading();

    // }, err => {
    //   this.planBFirewatch();
    // });
  }
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
  }
  sensorRender(datas: SensorType) {

    /* Temperature Value Control */
    datas.max = Number.parseFloat(datas.max).toFixed(1);

    /* Relative Humidity */
    datas.min = Number.parseFloat(datas.min).toFixed(1);

    /* Presure */
    datas.spl = Number.parseFloat(datas.spl).toFixed(1);


    /* Alarm Toggle State */
    datas.alm_toggle = false;
    // if (!this.sensor.alm_toggle) {
    //   if(datas.alm_mode) {
    //     datas.alm_toggle = true;
    //   } else {
    //     datas.alm_toggle = false;
    //   }
    // } else {
    //   datas.alm_toggle = true;
    // }

    return {
      ...datas
    };

  }

  closeAlarm(isAlarm:boolean = false) {
    if(!isAlarm) return;
    this.sensor.alm_toggle = false;
  }

  airtext: string = '';
  setPm25Emogi(pm25: number) {
    if (pm25 > -1000 && pm25 < 60000) {
      if (pm25 < 0 && pm25 > -1000) {
        // this.airtext = AIRTEXT[0];
        this.airtext = AIRTEXT[0];
      } else if(pm25 >= 0 && pm25 <= 12) {
        // this.pm25_emogi_status =  `assets/imgs/level${1}.png`;
        this.airtext = AIRTEXT[0];
      } else if(12 < pm25 && pm25 <= 35) {
        // this.pm25_emogi_status =  `assets/imgs/level${2}.png`;
        this.airtext = AIRTEXT[1];
      } else if(35 < pm25 && pm25 <= 55) {
        // this.pm25_emogi_status =  `assets/imgs/level${3}.png`;
        this.airtext = AIRTEXT[2];
      } else if(55 < pm25 && pm25 <= 150) {
        // this.pm25_emogi_status =  `assets/imgs/level${4}.png`;
        this.airtext = AIRTEXT[3];
      } else if(150 < pm25 && pm25 <= 250) {
        // this.pm25_emogi_status =  `assets/imgs/level${5}.png`;
        this.airtext = AIRTEXT[4];
      } else {
        this.airtext = AIRTEXT[5];
      }
    } else {
      if (pm25 === -8888) {
        this.airtext = AIRTEXT[6]; //  = 'ERROR_INTERNET';
      } else if(pm25 === -9999 ) {
        this.airtext = AIRTEXT[7]; //  = 'ERROR_DEVICE_TIMEOUT';
      } else if (pm25 >= 60000) {
        this.airtext = AIRTEXT[8]; // = '請開啟風扇'
      } else { // <= -1000
        this.airtext = AIRTEXT[0];
      }
    }

  };
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

  playSound(on:boolean = false) {
    if(on) {
      return;
    }
  }

  planBFirewatch() {
    this.showloading();
    this.rmAllDataSubs();
    this.planB$ = this.http
    .get('http://5326.tes-app.com/api/5326/latest/' + this.hasMac)
    .delay(2500)
    .repeat().subscribe(scc => {
      console.log(scc)
      this.removeTimeoutNW();
      if(!scc['error']) {
        if(scc['content']) {
          if(scc['content']._time) {
            let time = new Date().getTime();
            // if (scc['content']._time >= time - MinSensorTimeout) {
              this.sensor = this.sensorRender(scc['content']);
              //this.playSound(this.sensor.alm_toggle);
              this.addDataTimeout(setTimeout(() => {
                this.defaultDatas(-9999);
              }, MinSensorTimeout));
            // } else {
            //   this.defaultDatas(-9999);
            // }
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
      // this.fireDB.list('/BUGS/').push({
      //   err: JSON.stringify(debug),
      //   _t: new Date().getTime(),
      //   mac: this.hasMac
      // });
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
