import { SettingsProvider, StateType, MachineList, MachineType, _DefaultState } from './../../providers/settings/settings';
import { I18nListPage } from './../home/home';
import { ViewChild, Component } from '@angular/core';
import { IonicPage, NavController, NavParams, PopoverController, AlertController, LoadingController, Platform } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AutoMacProvider } from '../../providers/auto-mac/auto-mac';
import { ISubscription, Subscription } from 'rxjs/Subscription';
import { PopoverPage } from '../popover/popover';
@IonicPage()
@Component({
  selector: 'page-mac',
  templateUrl: 'mac.html',
})
export class MacPage {
  @ViewChild('macinput') macinput;
  macaddress: string = '';
  currentlang: string = '';
  macValue: string = '';
  bgUrl: string = '';
  constructor(
    public autoMacProvider: AutoMacProvider,
    private http: HttpClient,
    public translate: TranslateService,
    public loadingCtrl: LoadingController,
    public platform: Platform,
    private alertCtrl: AlertController,
    private settings: SettingsProvider,
    private formBuilder: FormBuilder,
    public popoverCtrl: PopoverController,
    public navCtrl: NavController, public navParams: NavParams) {
      this.platform.ready().then(ready => {
        this.currentlang = (this.translate.currentLang == 'en')?'English':'繁中';
        this.translate.onLangChange.subscribe((params) => {
          this.currentlang = (this.translate.currentLang == 'en')?'English':'繁中';
        })
      });
  }

  tap() {
    console.log('tap')
  }

  protected pressInterval: any;

  press(event) {
    console.log('press', event)
    // let a = setInterval(()=> {
    //   alert('3 seconds')
    //   clearInterval(a)
    // }, 3000)
    this.startInterval()
  }

  startInterval() {
    const self = this
    this.pressInterval = setInterval(() => {
      console.log('3 seconds')
      // this.stopInterval()
    }, 3000)
  }

  stopInterval() {
    clearInterval(this.pressInterval)
  }

  pressup(event) {
    console.log('pressup', event)
    this.stopInterval()
  }

  click() {
    console.log('click')
  }

  form: FormGroup;
  isValid: boolean = false;
  currentState: StateType = null;
  stateSub$: Subscription = null;
  ionViewDidEnter() {
    this.platform.ready().then(() => {
      this.settings.getStateFromStorage().take(1).subscribe(state => {
        this.stateSub$ = this.settings.getState().subscribe(s => {
          this.currentState = s;
          this.bgUrl = '"' + s.bgUrl + '"';
          if(s.mac && !this.settings.inited) {
            // 第一次進入，檢查MAC，有就進入感測器資訊頁面
            // this.navCtrl.setRoot(s.machineType + 'Page');
            this.navCtrl.setRoot('HomePage');
            //this.setLoading(false);
            console.log('============= GO =============');
          }
        }, err => {
          this.settings.updateState(_DefaultState).then(state => {
            this.currentState = state;
          })
        })
      }, err => {
        this.settings.updateState(_DefaultState).then(state => {
          this.currentState = state;
        })
      })
      this.settings.setInit(true);
    })
  }
  ionViewDidLoad() {
    this.form = this.formBuilder.group({
      macaddress: [
        '',
        Validators.compose([
          Validators.minLength(12), Validators.maxLength(12),  Validators.pattern('[a-fA-F0-9]*'), Validators.required
        ])],
    });
    this.form.valueChanges.subscribe((v) => {
      console.log(v);
      this.isValid = this.form.valid;
      let temp = this.form.getError('minLength')
      console.log(temp)
      console.log('isValid:' + this.isValid)
      if (this.isValid) {
        /* setTimeout(() => {
          this.showTransparentPage = false;
        }, 300); */
      }
    });
    setTimeout(() => {
      this.macinput.setFocus();
    },1200);

  }
  ionViewWillLeave() {
    this.stateSub$.unsubscribe();
  }
  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage, {
      page: 'MacPage',
    });
    popover.present({
      ev: myEvent,
    });
  }
  i18nPopover(myEvent) {
    let popover = this.popoverCtrl.create(I18nListPage);
    popover.present({
      ev: myEvent
    });
  }
  reg = new RegExp(/^[a-fA-F0-9]+$/);
  submit() {
    this.loadctrl(true);
    if(this.form.value.macaddress) {
      console.log(this.form.value.macaddress)
      let mac = this.form.value.macaddress;
      if (typeof mac === 'string') {
        mac = mac.toLowerCase().replace(':','').replace('-','').replace(' ','');
        if (mac.length === 12 && this.reg.test(mac)) {
          this.checkServerMac(mac);
          return true;
        } else {
          this.macError();
        }
      } else {
        this.macError();
      }
    } else {
      this.macError();
    }
  }
  checkSubs$: ISubscription = null
  rmCeckSubs$() {
    if(this.checkSubs$) {
      this.checkSubs$.unsubscribe();
      this.checkSubs$ = null;
    }
  }
  checkServerMac(mac: string) {
    // let t = MachineList.find(v => v.key === this.currentState.machineType);
    // if(!t) { alert('api路徑錯誤'); return false; }
    // 'http://5326.tes-app.com:8080/api/'
    this.checkSubs$ = this.http
    .get('http://5326.tes-app.com/api/5326/latest/' + mac) // http://5327.tes-app.com/api/53278/
    .subscribe(scc => {
      console.log(scc);

      if( !scc['error'] && scc['content']) {
        let item = scc['content'];
        if(item && item['id']) {
          this.settings
          .changeMachineType( (item['id'] === '5328') ? MachineType.D5328 : MachineType.D5327 )
          .then(state => {
            this.scc(mac, state.machineType);
          }, err => {
            this.macError();
          });
        } else {
          this.macError();
        }
      } else {
        this.macError();
      }
      this.loadctrl(false);
    }, err => {
      this.errorNetworkAlert();
    })
  }
  loaditem: any = null;
  loadctrl(isShow = false) {
    if(isShow) {
      this.loaditem = this.loadingCtrl.create();
      this.loaditem.present();
    } else {
      if(this.loaditem) {
        this.loaditem.dismiss();
        this.loaditem = null;
      }
    }
  }
  scc(mac, type) {
    this.loadctrl(false);
    this.translate.get(['INPUT_MACHINE_NAME', '確認', '略過', '成功', 'MY_DEVICE', 'CLICK_TO_PAGE', 'limit_cha', '超過字數限制']).subscribe(i18n => {
      let list = this.currentState.macHistories;
      let idx = list.findIndex(i => i.mac == mac);
      if(idx != -1) {
        this.setMac({
          macName: this.currentState.macHistories[idx].macName,
          mac,
          type,
        }, i18n)
      } else {
        let alert = this.alertCtrl.create({
          title: i18n['INPUT_MACHINE_NAME'],
          subTitle: mac,
          message: i18n['limit_cha'],
          inputs: [
            {
              name: 'machine_name',
              placeholder: i18n['MY_DEVICE']
            }
          ],
          buttons: [{
            text: i18n['確認'],
            handler: data => {
              if(data.machine_name.length > 10) {
                this.createAlert(i18n['超過字數限制']);
                return false;
              }
              let macName = data.machine_name || i18n['MY_DEVICE'];
              console.log(macName);
              this.setMac({
                macName,
                mac,
                type,
              }, i18n)
            }
          }]
        })
        alert.present();
      }
    })
  }

  createAlert(alertText) {
    alert(alertText);
  }


  setMac(macObj, i18n) {
    this.settings.setMac(macObj).then(state => {
      let alert = this.alertCtrl.create({
        title: i18n['成功'], // '成功',
        subTitle: i18n['CLICK_TO_PAGE'],
        buttons: [
          {
            text: i18n['確認'],
            role: 'cancel',
            handler: () => {
              // this.navCtrl.setRoot(state.machineType + 'Page');
              this.navCtrl.setRoot('HomePage');
            }
          }
        ]
      });
      alert.present();
    }, err => {
      alert('ERROR: ' + JSON.stringify(err));
    });
  }

  macError() {
    this.loadctrl(false);
    this.translate.get(['錯誤' , 'ERROR_MAC', '確認'])
    .subscribe(i18n => {
      let alert = this.alertCtrl.create({
        title: i18n['錯誤'],
        subTitle: i18n['ERROR_MAC'],
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
  errorNetworkAlert(debug = false) {
    this.loadctrl(false);
    this.translate.get(['錯誤' , 'ERROR_NETWORK', '確認'])
    .subscribe(i18n => {
      let alert = this.alertCtrl.create({
        title: i18n['錯誤'],
        subTitle: i18n['ERROR_NETWORK'] || '網路錯誤！',
        buttons: [{
            text: i18n['確認'],
            role: 'cancel',
            handler: () => {
            }
          }]
      });
      alert.present();
    });
  }
  cancel() {
    console.log(this.translate.langs);
    this.settings.getState().take(1).subscribe(state => {
      this.translate.get(['警告' , 'PLS_INSERT_MAC', '確認'])
      .subscribe(i18n => {
        console.log(i18n);

        if (!state.mac) {
          let alert = this.alertCtrl.create({
            title: i18n['警告'],
            subTitle: i18n['PLS_INSERT_MAC'] || '請先填寫Mac Address！',
            buttons: [
              {
                text: i18n['確認'],
                role: 'cancel',
                handler: () => {

                }
              }
            ]
          }).present();
        } else {
          // this.navCtrl.setRoot(state.machineType + 'Page');
          this.navCtrl.setRoot('HomePage');
        }

      });
    });


  }
  input($e) {
    this.form.patchValue({
      macaddress: $e
    });
  }
  showTransparentPage: boolean = false;
  itemSelected($e) {
    this.form.patchValue({
      macaddress: $e.mac
    });
  }
  autoBlur($e) {
    setTimeout(() => {
      this.showTransparentPage = false;
    });
  }
  autoFocus($e) {
    this.showTransparentPage = true;
  }
  chooseLang(lang: string) {
    this.platform.ready().then(() => {

      this.translate.setDefaultLang(lang);
      this.translate.use(lang);
      console.log(this.translate.currentLang);
      console.log(lang);
    });
  }
  eventHandler($e) {
    if($e === 13) {
      this.submit();
    }
  }

}
