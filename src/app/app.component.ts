import { SettingsProvider } from './../providers/settings/settings';
import { MacPage } from './../pages/mac/mac';
import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, LoadingController, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';
import { EasylinkPage } from '../pages/easylink/easylink';
import { TranslateService } from '@ngx-translate/core';
import { HotCodePush } from '@ionic-native/hot-code-push';
import { HttpClient, HttpParams } from '@angular/common/http';
// import { Network } from '@ionic-native/network';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Market } from '@ionic-native/market';
import { MobileAccessibility } from '@ionic-native/mobile-accessibility';

const options = {
  'config-file': 'http://tes-app.com:8080/chcp.json'
};
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  // rootPage: any = 'EasylinkPage';
  // rootPage: any = 'TesTypePage';
  rootPage: any = 'MacPage';
  // rootPage: any = 'HomePage';

  pages: Array<{title: string, component: any}>;

  constructor(
    private mobileAccessibility: MobileAccessibility,
    private market: Market,
    private screenOrientation: ScreenOrientation,
    // private network: Network,
    private http: HttpClient,
    private hotCodePush: HotCodePush,
    private alertCtrl: AlertController,
    public translate: TranslateService,
    // public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    private settings: SettingsProvider,
    // private afAuth: AngularFireAuth,
    // private fireDB: AngularFireDatabase,

    public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen
  ) {
    this.initializeApp();
    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', component: HomePage },
      { title: 'EasyLink', component: EasylinkPage },
      // { title: 'List', component: ListPage }
    ];
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.translate.setDefaultLang('zh-cmn-Hant');
      this.translate.use('zh-cmn-Hant');
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);

      this.statusBar.styleLightContent();

      // this.hotCodePush.getVersionInfo().then(res => {
      //   let cuv = res.currentWebVersion || '0';
      //   let appv = res.appVersion || '0';
      //   this.http.get(options['config-file']).take(1).subscribe((ver: any) => {
      //     let apprelease = ver.appVersion || '0';
      //     if(apprelease > appv) {
      //       this.translate.get(['FIND_UPDATE' , 'PLS_GO_STORE_UPDATE', 'UPDATE'])
      //       .subscribe(i18n => {
      //         let alert = this.alertCtrl.create({
      //           title: i18n['FIND_UPDATE'],
      //           subTitle: i18n['PLS_GO_STORE_UPDATE'],
      //           buttons: [
      //             {
      //               text: i18n['UPDATE'],
      //               role: 'cancel',
      //               handler: () => {
      //                 this.market.open('gowint.tes.pm25');
      //               }
      //             }
      //           ]
      //         });
      //         alert.present();
      //       });
      //     }
      //   }, err => {
      //     console.log('=======http.get=======');
      //     console.error(JSON.stringify(err));
      //     // this.errorNetwork('408');
      //   });
      // }, err => {
      //   // this.errorNetwork('400');
      //   // alert(JSON.stringify(err));
      // });
      if(this.mobileAccessibility){
        this.mobileAccessibility.usePreferredTextZoom(false);
        console.log('text false')
      }
      this.splashScreen.hide();

    });
  }
  errorNetwork(code = '0') {
    this.translate.get(['錯誤' , 'ERROR_NETWORK', '確認'])
    .subscribe(i18n => {
      let alert = this.alertCtrl.create({
        title: i18n['錯誤'],
        subTitle: i18n['ERROR_NETWORK'] + `(${code})`,
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
  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }
}
