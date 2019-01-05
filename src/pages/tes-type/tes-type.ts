import { SettingsProvider, MachineType, MachineList } from './../../providers/settings/settings';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, LoadingController } from 'ionic-angular';

/**
 * Generated class for the TesTypePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-tes-type',
  templateUrl: 'tes-type.html',
})
export class TesTypePage {
  typelist = MachineList;
  loading: any = null;
  hasType: boolean = true;

  constructor(
    public loadingCtrl: LoadingController,
    private settings: SettingsProvider,
    private platform: Platform,
    public navCtrl: NavController,
    public navParams: NavParams) {
    //this.setLoading(true);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TesTypePage');
  }
  ionViewDidEnter() {
    this.platform.ready().then(() => {
      this.settings.getState().take(1).subscribe(state => {
        if(state.machineType) {
          this.hasType = true;
          this.navCtrl.setRoot('EasylinkPage');
          this.setLoading(false);
        } else {
          this.hasType = false;
          this.setLoading(false);
        }
      });
    }, err => {
      alert('error');
      this.setLoading(false);
    });
  }

  clickOption(type: MachineType) {
    console.log(type);
    this.settings.changeMachineType(type).then(res => {
      this.navCtrl.setRoot('EasylinkPage');
    }, err => {
      alert('ERROR:' + err);
      this.navCtrl.setRoot('EasylinkPage');
    })
  }
  setLoading(isShow = false) {
    if(isShow) {
      if(!this.loading) {
        this.loading = this.loadingCtrl.create();
        this.loading.present();
      }
    } else {
      if(this.loading) {
        this.loading.dismiss();
        this.loading = null;
      }
    }

  }

}
