import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TipsPage } from './tips';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    TipsPage,
  ],
  imports: [
  	TranslateModule.forChild(),
    IonicPageModule.forChild(TipsPage),
  ],
})
export class TipsPageModule {}
