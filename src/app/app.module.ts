import { myInterceptor } from './../providers/http-interceptor/http-interceptor';
/* import { BoldPrefix } from '../components/boldprefix.pipe';
import { AutoCompleteComponent } from '../components/auto-complete/auto-complete.component';*/
// import { ComponentsModule } from '../components/components.module';
import { MacPage } from '../pages/mac/mac';
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { I18nListPage } from '../pages/home/home';
import { PopoverPage } from '../pages/popover/popover'
import { ListPage } from '../pages/list/list';
import { EasylinkPage } from '../pages/easylink/easylink';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

// import { AngularFireDatabaseModule } from 'angularfire2/database';
// import { AngularFireModule } from 'angularfire2';
// import { AngularFireAuthModule } from 'angularfire2/auth';
import { Zeroconf } from '@ionic-native/zeroconf';
import { Network } from '@ionic-native/network';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Diagnostic } from '@ionic-native/diagnostic';
import { SettingsProvider } from '../providers/settings/settings';
import { NativeStorage } from '@ionic-native/native-storage';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

import { IonicImageViewerModule } from 'ionic-img-viewer';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// import { HttpModule, Http } from '@angular/http';
import { HotCodePush } from '@ionic-native/hot-code-push';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Market } from '@ionic-native/market';
// import { AutoCompleteModule } from 'ionic2-auto-complete';
import { AutoMacProvider } from '../providers/auto-mac/auto-mac';
// import { AutoCompleteModule } from '../components/auto-complete/auto-complete.module';
import { MobileAccessibility } from '@ionic-native/mobile-accessibility';
import { FileChooser } from '@ionic-native/file-chooser';
import { FilePath } from '@ionic-native/file-path';
import { Media } from '@ionic-native/media';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const firebaseConfig = {
};

@NgModule({
  declarations: [
    // MacPage,
    /* AutoCompleteComponent,
    BoldPrefix, */
    MyApp,
    PopoverPage, I18nListPage,
    ListPage
  ],
  imports: [
    // ComponentsModule,
    // AutoCompleteModule,
    IonicImageViewerModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    BrowserModule,
    IonicModule.forRoot(MyApp),
    // AngularFireDatabaseModule,
    // AngularFireAuthModule,
    // AngularFireModule.initializeApp(firebaseConfig),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    // MacPage,
    MyApp,
    PopoverPage, I18nListPage,
    ListPage
  ],
  providers: [
    [ { provide: HTTP_INTERCEPTORS, useClass:
      myInterceptor, multi: true } ],
    Market,
    ScreenOrientation,
    HotCodePush,
    NativeStorage,
    Diagnostic,
    AndroidPermissions,
    Network,
    Zeroconf,
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    SettingsProvider,
    AutoMacProvider,
    MobileAccessibility,
    FileChooser,
    FilePath,
    Media
  ]
})
export class AppModule {}
