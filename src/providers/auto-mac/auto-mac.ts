import { SettingsProvider } from './../settings/settings';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AutoCompleteService } from 'ionic2-auto-complete';
import { NativeStorage } from '@ionic-native/native-storage';
interface macData {
  macName: string;
  mac: string;
}
@Injectable()
export class AutoMacProvider implements AutoCompleteService {
  labelAttribute = 'mac'
  history: Array<macData> = [];
  constructor(
    public settings: SettingsProvider,
    private storage: NativeStorage,
    public http: HttpClient) {
    console.log('Hello AutoMacProvider Provider');
    this.settings.getState().subscribe(state => {
      this.history = state.macHistories;
    });
  }
  /** AUTO-COMPLETE */
  getResults(keyword:string): Array<macData> {
    // let results = [];
    // this.settings.getState().take(1).toPromise().then()
    // await this.storage.getItem(STORAGE_MAC_HISTORIES + '_' + this.settings.machineType)
    // .then((list: Array<string>) => {
    //   results = list.slice(0, 5);
    // }, err => {
    // });
    return this.history.slice(0, 5);

  }
  getItemLabel(macObj: macData) {
    return {
      macName: macObj.macName,
      mac: macObj.mac.toUpperCase()
    };
    /*mac[0] + '' +
    mac[1] + ':' +
    mac[2] + '' +
    mac[3] + ':' +
    mac[4] + '' +
    mac[5] + ':' +

    mac[6] + '' +
    mac[7] + ':' +
    mac[8] + '' +
    mac[9] + ':' +
    mac[10] +'' +
    mac[11] + '';*/
  }
}
