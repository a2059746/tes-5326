import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EasylinkPage } from './easylink';
import { TranslateModule } from '@ngx-translate/core';
@NgModule({
  declarations: [
    EasylinkPage,
  ],
  entryComponents: [
  ],
  imports: [
  	TranslateModule.forChild(),
    IonicPageModule.forChild(EasylinkPage),
  ],
})
export class EasylinkPageModule {}
