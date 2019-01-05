import { ISubscription, Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { SettingsProvider, StateType, _BACKGROUND_URL } from './../../providers/settings/settings';
import { ViewChild, Component } from '@angular/core';
import { LoadingController, PopoverController, AlertController, IonicPage, NavController, NavParams, Platform, ModalController, ViewController } from 'ionic-angular';
import { Zeroconf } from '@ionic-native/zeroconf';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Diagnostic } from '@ionic-native/diagnostic';
import { I18nListPage } from './../home/home';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@ionic-native/network';
import { PopoverPage } from '../popover/popover';
const TIMEOUT = 42000;
declare var cordova: any;
declare var easyLink: any;
declare var WifiWizard2: any;
@IonicPage()
@Component({
  selector: 'page-easylink',
  templateUrl: 'easylink.html',
})
export class EasylinkPage {
  @ViewChild('pwinput') pwinput ;
  @ViewChild('ssidinput') ssidinput ;

  isEasyLinking: boolean = false;
  bgUrl: string = '"' + _BACKGROUND_URL.Tes5327 + '"';

  mdns: Array<any> = [];
  currentlang: string = '繁中';
  loading: any = null;
  constructor(
    private network: Network,
    public translate: TranslateService,
    public popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    public modalCtrl: ModalController,
    private diagnostic: Diagnostic,
    private androidPermissions: AndroidPermissions,
    private platform: Platform,
    private zeroconf: Zeroconf,
    private settings: SettingsProvider,
    public loadingCtrl: LoadingController,
    public navCtrl: NavController, public navParams: NavParams) {
      this.platform.ready().then(() => {

        this.currentlang = (this.translate.currentLang == 'en')?'English':'繁中';
        this.translate.onLangChange.subscribe((params) => {
          this.currentlang = (this.translate.currentLang == 'en')?'English':'繁中';
        });
        this.setLoading(true);
      });
  }
  $networkChange: ISubscription;
  networkType: string = null;
  onlyread: boolean = false;

  setLoading(isShow = false) {
    if(isShow) {
      if(!this.loading) {
        this.loading = this.loadingCtrl.create();
        this.loading.present();
      }
    } else {
      if(this.loading) {
        this.loading.dismiss();
        this.loading = null;
      }
    }

  }
  settingSubs$: Subscription = null;
  ionViewDidLoad() {
    console.log('ionViewDidLoad EasylinkPage');
    this.platform.ready().then(() => {
      this.$networkChange = this.network.onchange().subscribe(() => {
        setTimeout(() => {
          this.networkType = this.network.type;
          console.log( '========= network.onchange() =========' );
          console.log( this.network.type );
        },1000);
      });
      this.networkType = this.network.type;
    });
  }
  ionViewWillUnload() {
    if(this.$networkChange) {
      this.$networkChange.unsubscribe();
    }
    // this.settingSubs$ =
    // if(this.settingSubs$) {
    //   this.settingSubs$.unsubscribe();
    // }
  }
  currentState: StateType = null;
  ionViewDidEnter() {
    this.platform.ready().then(() => {
      this.settings.getState().take(1).subscribe(state => {
        this.currentState = state;
        console.log('===== EasylinkPage State Change =====');
        this.bgUrl = '"' + state.bgUrl + '"';
        if(state.mac && !this.settings.inited) {
          //第一次進入，檢查MAC，有就進入感測器資訊頁面
          this.settings.setInit(true);
          // this.navCtrl.setRoot(state.machineType + 'Page');
          this.navCtrl.setRoot('HomePage');
          this.setLoading(false);
          console.log('============= GO =============');
        } else {
          setTimeout(() => {
            this.checkWiFi();
          }, 1000);
        }
      });
    });
  }
  ssid: Array<any> = [];
  wifiset = {
    ssid: '',
    pw: '',
  }
  ww: Array<any> = [];
  isNoWifi = false;
  checkWiFi() {
    this.setLoading(true);
    this.$checkWiFi().subscribe(ok => {
      this.setLoading(false);
      this.settings.setInit(true);
      if(ok) {
        switch(ok) {
          case '1':  // has SSID
            setTimeout(() => {
              this.pwinput.setFocus();
              setTimeout(() => {
                this.pwinput.setFocus();
              },1300);
            },800);
          break;
          case '0':  // NO SSID / SSID length = 0
            setTimeout(() => {
              this.ssidinput.setFocus();
              setTimeout(() => {
                this.ssidinput.setFocus();
              },1300);
            },800);
          break;
          case '-1':  // ERROR
          break;
        }
      }

    }, err => {
      this.setLoading(false);
    });
  }
  $checkWiFi(): Observable<boolean | string> {
    return Observable.create(observer => {
      this.setLoading(true);
      setTimeout(() => {
        console.log(this.networkType);
        if (this.networkType == 'wifi') {
          this.isNoWifi = false;
          this.onlyread = false;
          this.getSSid().subscribe(st => {
            observer.next(st);
            observer.complete();
          });
        } else {
          this.isNoWifi = true;
          this.onlyread = true;
          this.plsEnableWiFi();
          observer.next(false);
          observer.complete();
        }
      },1000);



        /*
      this.diagnostic.isWifiAvailable().then(res => {
        this.ww.push(res);
      }).catch(err =>{
        if(res) {
          this.isNoWifi = false;
          this.onlyread = false;
          this.getSSid().subscribe(st => {
            observer.next(st);
            observer.complete();
          });
        } else {
          this.isNoWifi = true;
          this.onlyread = true;
          this.plsEnableWiFi();
          observer.next(false);
          observer.complete();
        }
        alert(JSON.stringify(err));
        this.ww.push(err);
        this.ww.push('ERR');
        console.log('err: ' + JSON.stringify(err));

        observer.next(false);
        observer.complete();
      });*/
    });
  }
  eslinkLogs: Array<any> = [];
  plsEnableWiFi() {
    this.translate.get(['取消', 'PLS_ENABLE_WIFI_MESSAGE', '警告', '確認']).subscribe(i18n => {
      let alert = this.alertCtrl.create({
        enableBackdropDismiss: false,
        title: i18n['警告'],
        subTitle: i18n['PLS_ENABLE_WIFI_MESSAGE'],
        buttons: [{
          text: i18n['取消'],
          role: 'cancel',
          handler: () => {
            this.cancel();
          }
        }, {
            text: i18n['確認'],
            role: 'cancel',
            handler: () => {
              this.checkWiFi();
            }
        }]
      }).present();
    });
  }
  startES() {
    this.mdns = [];
    if(this.networkType != 'wifi') {
      this.checkWiFi();
      return false;
    }

    if(this.wifiset.ssid.length > 0) {
      //  && this.wifiset.pw.length > 0
      this.eslinkLogs.push({
        actions: 'START',
        wifiset: {... this.wifiset}
      });
      this.isEasyLinking = true;
      /** AWS */
      this.doESTimeout(true);
      /** */
      easyLink.startSearch(this.wifiset.ssid, this.wifiset.pw, (res) => {
        console.log(' ================ EASYLINK startSearch SCC ==================');
        console.log(res);
        console.log(' ================ ======================== ==================');
        // let r = JSON.parse(res);
        this.onEasylinkSuccessd(res);
        // this.eslinkLogs.push(res);
      },(err) => {
        console.log(' ================ EASYLINK startSearch ERR ==================');
        console.log(err);
        console.log(' ================ ======================== ==================');
        this.eslinkLogs.push(err);
      });
      // this.startWatch();
    } else {
      this.translate.get(['警告', 'WARN_PLS_INPUT_SSID', 'WARN_PLS_INPUT_PW', '確認'])
      .subscribe(i18n => {
        let alert = this.alertCtrl.create({
          title: i18n['警告'],
          // subTitle: (!this.wifiset.ssid.length)? i18n['WARN_PLS_INPUT_SSID'] : i18n['WARN_PLS_INPUT_PW'],
          subTitle: i18n['WARN_PLS_INPUT_SSID'],
          buttons: [
            {
              text: i18n['確認'],
              role: 'cancel',
              handler: () => {

              }
            }
          ]
        });
        alert.present();
      });
    }

  }
  isResolved: boolean = false;
  timeout() {
    this.stopES();
    this.translate.get(['TIMEOUT', 'PLS_RETRY', '確認'])
    .subscribe(i18n => {
      let alert = this.alertCtrl.create({
        title: i18n['TIMEOUT'],
        subTitle: i18n['PLS_RETRY'],
        buttons: [ {
            text: i18n['確認'],
            role: 'cancel',
            handler: () => {

            }
        }, ]
      });
      alert.present();
    });

  }
  timeoutObj: any = null;
  dupES = false;
  startWatch() {  // Deprecated
    this.isResolved = false;
    this.doESTimeout();

    let sTime = new Date().getTime();
    this.dupES = false;

    this.zeroconf.watch('_easylink._tcp.', 'local.').subscribe(result => {
      console.log(JSON.stringify(result));

      // this.mdns.push(result);   // added, resolved, removed
      if (result.action == 'resolved' && !this.isResolved) {
        let eTime = new Date().getTime();
        if(((eTime - sTime) < 3000) && !this.dupES) {
          this.dupES = true;
          return false;
        }
        this.onEasylinkSuccessd(result);
      } else {
        console.log('service removed', result.service);
      }

    });

  }
  onEasylinkSuccessd(result) {
    this.stopES();
    // console.log('service added', result.service);
    this.isResolved = true;
    this.translate.get(['成功' , 'SUCCESS_EASYLINK', '確認'])
    .subscribe(i18n => {
      // this.mdns.push(result);
      this.settings.updateState({  // 已經成功easylink過
        didEasylink: true,
      });
      let alert = this.alertCtrl.create({
        title: i18n['成功'],
        subTitle: i18n['SUCCESS_EASYLINK'],
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
  stopES() {
    this.doESTimeout(false);
    if(easyLink && this.isEasyLinking) {
      /** OLD
      this.zeroconf.unwatch('_easylink._tcp.', 'local.').then(() => {
        this.zeroconf.reInit();
      }); */
      easyLink.stopSearch((res) => {
        console.log(' ================ EASYLINK stopSearch SCC  ==================');
        console.log(res);
        console.log(' ================ ======================== ==================');
        this.eslinkLogs.push(res);
      },(err) => {
        console.log(' ================ EASYLINK stopSearch SCC  ==================');
        console.log(err);
        console.log(' ================ ======================== ==================');
        alert(JSON.stringify(err));
        this.eslinkLogs.push(err);
      });
      this.isEasyLinking = false;


    }

  }
  async permission() {
    /* await this.androidPermissions.requestPermissions([
      this.androidPermissions.PERMISSION.INTERNET,
      this.androidPermissions.PERMISSION.ACCESS_NETWORK_STATE,
      this.androidPermissions.PERMISSION.ACCESS_WIFI_STATE,
      this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION,
      this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION,
    ]).then(scc => {
      console.log('scc');
      console.log(JSON.stringify(scc));
    }, err => {
      console.log(err);
    }) */
    await this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.INTERNET).then(
      result => {
        console.log('INTERNET Has permission?',result.hasPermission);
        // if (!result.hasPermission) { this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.INTERNET) }
      },
      err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.INTERNET)
    );
    await this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_NETWORK_STATE).then(
      result => {
        console.log('ACCESS_NETWORK_STATE Has permission?',result.hasPermission);
        // if (!result.hasPermission) { this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_NETWORK_STATE) }
      },
      err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_NETWORK_STATE)
    );
    await this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_WIFI_STATE).then(
      result => {
        console.log('ACCESS_WIFI_STATE Has permission?',result.hasPermission);
        // if (!result.hasPermission) { this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_WIFI_STATE) }
      },
      err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_WIFI_STATE)
    );
    let ver = this.platform.version();
    if(ver.major >= 8) {
      await this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION).then(
        result => {
          console.log('ACCESS_FINE_LOCATION Has permission?',result.hasPermission);
          // if (!result.hasPermission) { this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION) }
        },
        err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION).then(scc => {
          console.log(scc);
        }, err2 => {
          console.log(err2);
        })
      );
      await this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION).then(
        result => {
          console.log('ACCESS_COARSE_LOCATION Has permission?',result.hasPermission);
          // if (!result.hasPermission) { this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION) }
        },
        err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.ACCESS_COARSE_LOCATION)
      );
    }
    /*
    await this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CHANGE_WIFI_STATE).then(
      result => console.log('CHANGE_WIFI_STATE Has permission?',result.hasPermission),
      err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CHANGE_WIFI_STATE)
    );
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CHANGE_NETWORK_STATE).then(
      result => console.log('CHANGE_NETWORK_STATE Has permission?',result.hasPermission),
      err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CHANGE_NETWORK_STATE)
    ); */

  }
  getSSid(): Observable<string> {
    return Observable.create(observer => {
      this.platform.ready().then(async () => {
        await this.permission();
        WifiWizard2.getConnectedSSID().then(ssid => {
          /* console.log(' ================ EASYLINK getWifiSSid SCC  ==================');
          console.log(ssid);
          console.log(' ================ ======================== =================='); */
          if(typeof ssid == 'string') {
            this.wifiset.ssid = ssid;
            if(ssid.length) {
              observer.next('1');
            } else {
              observer.next('0');
            }
          } else {
            observer.next('0');
          }
        }, err => {
          /* console.log(' ================ EASYLINK getWifiSSid ERR  ==================');
          console.log(err);
          console.log(' ================ ======================== =================='); */
          this.ssid.push(err);
          alert(JSON.stringify(err));
          observer.next('-1');
        });
        /*easyLink.getWifiSSid((res) => {
          console.log(' ================ EASYLINK getWifiSSid SCC  ==================');
          console.log(res);
          console.log(' ================ ======================== ==================');
          if(typeof res == 'string') {
            this.wifiset.ssid = res;
            if(res.length) {
              observer.next('1');
            } else {
              observer.next('0');
            }
          } else {
            observer.next('0');
          }
        },(err) => {
          console.log(' ================ EASYLINK getWifiSSid ERR  ==================');
          console.log(err);
          console.log(' ================ ======================== ==================');
          this.ssid.push(err);
          alert(JSON.stringify(err));
          observer.next('-1');
        });*/
      });
    });
  }


  openModal() {

    let modal = this.modalCtrl.create('TipsPage');
    modal.present();
  }

  passwordType: string = 'password';
  passwordIcon: string = 'eye-off';

  hideShowPassword() {
      this.passwordType = this.passwordType === 'text' ? 'password' : 'text';
      this.passwordIcon = this.passwordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }
  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage, {
      page: 'EasylingPage'
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
  cancel() {
    // this.navCtrl.setRoot(this.currentState.machineType + 'Page');
    this.navCtrl.setRoot('HomePage');
  }
  ssidHandler($e) {
    if($e === 13) {
      setTimeout(() => {
        this.pwinput.setFocus();
      },300);
    }
  }
  passwdHandler($e) {
    if($e === 13 && this.wifiset.pw.length) {
      this.startES();
    }
  }
  doESTimeout(run = false) {
    if(this.timeoutObj) {
      clearTimeout(this.timeoutObj);
      this.timeoutObj = null;
    }
    if(run) {
      this.timeoutObj = setTimeout(() => {
        this.timeout();
      }, TIMEOUT);
    }
  }
}
