import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomePage } from './home';
import { TranslateModule } from '@ngx-translate/core';
@NgModule({
  declarations: [
    HomePage,
  ],
  entryComponents: [
  ],
  imports: [
  	TranslateModule.forChild(),
    IonicPageModule.forChild(HomePage),
  ],
})
export class HomePageModule {}
