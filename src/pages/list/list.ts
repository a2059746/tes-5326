import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { Zeroconf } from '@ionic-native/zeroconf';
declare var cordova: any;
@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {
  mdns: Array<any> = [];

  constructor(
    private platform: Platform,
    private zeroconf: Zeroconf,
    public navCtrl: NavController, public navParams: NavParams) {
    // If we navigated to this page, we will have an item available as a nav param
    this.zeroconf.watch('_http._tcp.', 'local.').subscribe(result => {
      this.mdns.push(result);
      if (result.action == 'added') {
        console.log('service added', result.service);
      } else {
        console.log('service removed', result.service);
      }
    });
  }
  get() {
    this.platform.ready().then(() => {
      console.log(cordova);
  });
  }
}
