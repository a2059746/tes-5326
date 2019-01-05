import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { BoldPrefix } from './boldprefix.pipe';
import {IonicModule} from 'ionic-angular';
import { TestComponent } from './test/test';
import { LongPressModule } from 'ionic-long-press';

@NgModule({
	declarations: [
		TestComponent,
		//AutoCompleteComponent,
		BoldPrefix,
	],
	imports: [
    LongPressModule,
		CommonModule,
		FormsModule,
		IonicModule,
	],
	exports: [
		// AutoCompleteModule,
		TestComponent,
		// AutoCompleteComponent,
		BoldPrefix,
    ]
})
export class ComponentsModule {}
