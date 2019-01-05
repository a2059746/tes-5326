import { ComponentsModule } from './../../components/components.module';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MacPage } from './mac';
import { TranslateModule } from '@ngx-translate/core';
// import { AutoCompleteModule } from 'ionic2-auto-complete';
import { AutoMacProvider } from '../../providers/auto-mac/auto-mac';
import { LongPressModule } from 'ionic-long-press';
// import { AutoCompleteModule } from '../../components/auto-complete/auto-complete.module';
@NgModule({
  declarations: [
    MacPage,
  ],
  imports: [
    LongPressModule,
    ComponentsModule,
    TranslateModule.forChild(),
    IonicPageModule.forChild(MacPage),
  ],
  providers: [
    AutoMacProvider,
  ]
})
export class MacPageModule {}
