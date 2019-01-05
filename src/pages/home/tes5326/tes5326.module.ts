import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Tes5326Page } from './tes5326';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    Tes5326Page,
  ],
  imports: [
    TranslateModule.forChild(),
    IonicPageModule.forChild(Tes5326Page),
  ],
})
export class Tes5326PageModule {}
