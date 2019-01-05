import { TranslateService } from '@ngx-translate/core';
import { MachineType, _SAMPLE_ALARM_ID, _ALARM_ID } from './../../providers/settings/settings';
import { ImageViewerController } from 'ionic-img-viewer';
import { LoadingController, NavController, ViewController, AlertController, NavParams, App } from 'ionic-angular';
import { SettingsProvider, MachineList } from '../../providers/settings/settings';
import { ISubscription, Subscription  } from 'rxjs/Subscription';
import { Component, EventEmitter } from '@angular/core';
import { FileChooser } from '@ionic-native/file-chooser';
import { FilePath } from '@ionic-native/file-path';
import { MediaObject } from '@ionic-native/media';

@Component({
  selector: 'app-popover',
  templateUrl: 'popover.html',

})
export class PopoverPage {
  typelist = MachineList;
  _imageViewerCtrl: ImageViewerController;
  isAlarming: boolean = false;
  constructor(
    private filePath: FilePath,
    private fileChooser: FileChooser,
    public translate: TranslateService,
    public loadingCtrl: LoadingController,
    public imageViewerCtrl: ImageViewerController,
    protected app: App,
    public navParams: NavParams,
    public settings: SettingsProvider,
    private alertCtrl: AlertController,
    public navCtrl: NavController,
    public viewCtrl: ViewController) {
      this._imageViewerCtrl = imageViewerCtrl;
      this.refreshEvent = this.settings.refreshEvent;
  }
  hasMac: any = false;
  subs$: ISubscription = null;
  refreshEvent: EventEmitter<boolean>;
  isExapndOption: boolean = false;
  type: any = MachineType;

  almList: Array<{
    type: string,
    label: string,
    value: string,
    checked: boolean,
    handler?: Function,
  }>;

  ionViewDidEnter() {
    this.almList = [];
    this.settings.getState().take(1).subscribe(state => {
      this.type = state.machineType;
      let n = this.navCtrl.getActive();
      if(n['data']) {
        if(n['data'].page === 'HomePage') {


            this.hasMac = state.mac;
        }
      }
    });

  }
  ionViewWillOnLoad() {

  }

  alarmSub$: Subscription = null;
  alarmList: Array<string> = [];
  isSampleAlarm = false;
  sampleAudio: MediaObject;

  almSample(uri: string) {
    if(this.isSampleAlarm) {
      this.alarmSub$.unsubscribe();
      this.alarmSub$ = null;
      this.settings.stopAlarmSound(this.sampleAudio);
      this.isSampleAlarm = false
    }
    this.sampleAudio = this.settings.createAlarmSound(uri);
    this.settings.playAlarmSound(this.sampleAudio);
    this.isSampleAlarm = true;
    if(!this.alarmSub$) {
      this.alarmSub$ = this.settings.getAlarmStatus(this.sampleAudio).subscribe(statusCode => {
        if(statusCode == 4)
        {
          this.sampleAudio.play();
        }
      })
    }
  }

  selectAlmSound() {
    this.translate.get(['警報', '確認', '設定警報聲', '上傳', '刪除', 'IS_DELETE_Audio', '預設鈴聲無法被刪除']).take(1).subscribe(i18n => {
      this.settings.getAlarmSoundFromList().then((list: Array<string>) => {
        console.log('hi');
        console.log(this.alarmList.length)
        this.alarmList = list;
        list.forEach((uri,idx) => {
          let checked = false;
          let audioName = uri.match(/(?<=\/(?!.*\/))(.*)(?=\.)/)[0];
          if(uri == this.settings.currentAlmUri) { checked = true}
          this.almList.push({
            type: 'radio',
            label: audioName,
            value: uri,
            checked: checked,
            handler: () => {
              this.almSample(uri);
            }
          })
          checked = false;
        })
        console.log(this.alarmList.length)

        let alert = this.alertCtrl.create({
          cssClass: 'custom-alert',
          title: i18n['設定警報聲'],
          inputs: this.almList,
          buttons: [{
            text: i18n['刪除'],
            role: 'cancel',
            handler: data => {
              if(this.alarmSub$) {
                this.alarmSub$.unsubscribe();
                this.settings.stopAlarmSound(this.sampleAudio);
              }
              let idx = list.findIndex(i => i == data)
              if(idx >= 0 && idx <= 4) {
                this.defaultAudioAlt(i18n)
              } else {
                this.deleteAudio(i18n, data)
              }
            }
          },{
            text: i18n['上傳'],
            role: 'cancel',
            handler: () => {
              if(this.alarmSub$) {
                this.alarmSub$.unsubscribe();
                this.settings.stopAlarmSound(this.sampleAudio);
              }
              this.uploadAudioFile();
            }
          }, {
            text: i18n['確認'],
            role: 'cancel',
            handler: data => {
              if(this.isSampleAlarm) {
                this.alarmSub$.unsubscribe();
                this.settings.stopAlarmSound(this.sampleAudio);
                this.isSampleAlarm = false
              }
              this.settings.saveAlarmSound(data)
              this.settings.currentAlmUri = data;
            },
          }],
          enableBackdropDismiss: false
        })
        alert.present();
        this.viewCtrl.dismiss();
      })
    })
  }

  defaultAudioAlt(i18n) {
    let alert = this.alertCtrl.create({
      title: i18n['預設鈴聲無法被刪除'],
      buttons: [{
          text: 'Yes',
          role: 'cancel',
          handler: () => {
            this.almList = [];
            this.selectAlmSound()
          }
        }]
    })
    alert.present();
  }

  deleteAudio(i18n, uri) {
    let audioName = uri.match(/(?<=\/(?!.*\/))(.*)/)[0];
    let alert = this.alertCtrl.create({
      title: i18n['IS_DELETE_Audio'],
      subTitle: i18n['刪除'] + '" ' + audioName + ' " ' + ' ?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {
            this.almList = [];
            this.selectAlmSound()
          }
        },
        {
          text: 'Yes',
          role: 'cancel',
          handler: () => {
            this.settings.removeAlarmSoundFromList(uri).then(list => {
              this.settings.saveAlarmSound(list[0])
              this.settings.currentAlmUri = list[0]
              this.almList = []
              this.selectAlmSound()
            })
          }
        }
      ]
    })
    alert.present();
  }

  uploadAudioFile() {
    return new Promise((resolve, reject) => {
      this.fileChooser.open().then(nativePath => {
        this.filePath.resolveNativePath(nativePath).then(filePath => {
          if(chooseFileOk(filePath, ['mp3', 'm4a'])){
            if(!this.alarmList.find(uri => uri == filePath)) this.alarmList.push(filePath);
            this.settings.currentAlmUri = filePath;
            this.settings.saveAlarmSoundToList(this.alarmList).then(r => {
              this.almList = [];
              this.selectAlmSound();
            });
          } else {
            this.wrongTypeAudioAlt()
            // this.translate.get(['錯誤的音樂格式']).take(1).subscribe(i18n => {
            //   alert(i18n['錯誤的音樂格式'])
            //   this.almList = [];
            //   this.selectAlmSound();
            // })
          }
        }, err => {
          console.log('error file choosen')
          console.log(err)
          return reject(err)
        })
      }, err => {
        console.log('open device directory failed')
        console.log(err)
        return reject(err)
      })
    })
  }

  wrongTypeAudioAlt() {
    this.translate.get(['錯誤的音樂格式', '確認']).take(1).subscribe(i18n => {
      let alert = this.alertCtrl.create({
        title: i18n['錯誤的音樂格式'],
        buttons: [{
          text: i18n['確認'],
          role: 'cancel',
          handler: () => {
            this.almList = [];
            this.selectAlmSound()
          }
        }],
        enableBackdropDismiss: false
      })
      alert.present();
    })
  }


  goPage(page: string) {
    let current = this.navParams.get('page') || 'NULL'
    if (page !== current) {
      this.viewCtrl.dismiss();
      this.app.getRootNav().setRoot(page);
    } else {

    }
  }
  pushPage(page: string) {
    this.app.getRootNav().setRoot(page);
    this.close();
    // this.navCtrl.push(page);
  }
  changeMachine(type) {
    this.settings.changeMachineType(type).then(res => {
      this.app.getRootNav().setRoot('EasylinkPage');
      this.close();
    }, err => {
      alert('ERROR:' + JSON.stringify(err));
    });
  }

  presentImage(myImage) {
    const imageViewer = this._imageViewerCtrl.create(myImage);
    imageViewer.present();
    // imageViewer.onDidDismiss(() => alert('Viewer dismissed'));
  }
  refresh() {
    this.refreshEvent.emit(true);
    /*let loading = this.loadingCtrl.create({
      content: 'Please wait...',
      duration: 700,
    });
    loading.present();;*/
    this.close();
  }
  close() {
    this.viewCtrl.dismiss();
  }

  expandMachineOptions() {
    if(this.isExapndOption) {
      this.isExapndOption = false;
    } else {
      this.isExapndOption = true;
    }
  }
}

function checkFileType(path:string, fileExt:Array<string>) {
  console.log('checking')
  let regexTest = ''
  fileExt.forEach((e, idx) => {
    if(idx == 0) {
      regexTest = regexTest + e;
    } else {
      regexTest = regexTest + '|' + e;
    }
  });
  return path.match(new RegExp('(' + regexTest + ')' + '$', 'i'));
}

function chooseFileOk(uri: string, fileExt:Array<string>) {
  if (!checkFileType(uri, fileExt)) {
    console.log('wrong file type')
    return false;
  } else {
    console.log('correct file type')
    return uri;
  }
}
