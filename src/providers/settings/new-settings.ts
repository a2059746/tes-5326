import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter } from '@angular/core';
import { Platform, AlertController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ISubscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromPromise';
import { NativeStorage } from '@ionic-native/native-storage';
export const STORAGE_CURRENT_STATE = 'SETTINGS';
export const STORAGE_MAC_HISTORIES = 'MAC_HISTORIES';
export const defaultState: stateType = {
	mac: null,
	inited: false,
	didEasylink: false,
}
export interface stateType {
	mac?: string;
	inited?: boolean;
	didEasylink?: boolean;
}
@Injectable()
export class SettingsProvider {
	state: Observable<stateType>;
	refreshEvent: EventEmitter<boolean> = new EventEmitter<boolean>();
	private _state: BehaviorSubject<stateType>;
	datastore: {
		data: stateType,
	} = {
		data: defaultState
	};
	inited: boolean = false;
  constructor(
  	private alertCtrl: AlertController,
  	private platform: Platform,
    private storage: NativeStorage,
  	public http: HttpClient) {
  	this._state = <BehaviorSubject<stateType>>new BehaviorSubject({});
    this.state = this._state.asObservable();
    // this._state.next(defaultState);
    this.getFromStorage().subscribe();
	}
	setInit(i = false) {
		this.inited = i;
	}
  getFromStorage(isInit = false): Observable<stateType> {
  	return Observable.create(observer => {
  		this.platform.ready().then(() => {
  			this.storage
	  		.getItem(STORAGE_CURRENT_STATE)
	  		.then(val => {
	  			this.updateState(val);
	  			observer.next(val);
	  			observer.complete();
	  		}, err => {
					this.updateState(defaultState);
	  			console.log(err);
	  			observer.next(defaultState);	// TODO
	  			observer.complete();
	  		});
  		});

  	});
  }
  save(state: stateType) {
  	this.platform.ready().then(() => {
		  	this.storage.setItem(STORAGE_CURRENT_STATE, state).then(res => {

		  	});
		});
	}
	clear() {
		this.platform.ready().then(() => {
			this.storage.remove(STORAGE_CURRENT_STATE).then(res => {

			});
		});
	}
	updateState(state: stateType) {
		Object.assign(this.datastore.data, state);
		this.brod();
	}
  brod() {
		this.save(this.datastore.data);
  	this._state.next(Object.assign({}, this.datastore).data);
  }
	presentPrompt() {
		let alert = this.alertCtrl.create({
		  cssClass: 'prompt-mac',
		  title: '請輸入裝置Mac address',
		  subTitle: '(12個英文字，無其他符號)',
		  inputs: [
		    {
		      name: 'mac',
		      placeholder: 'Ex. "ABCDEF123456"'
		    }
		  ],
		  buttons: [{
		      text: '取消',
		      role: 'cancel',
		      handler: data => {
		        console.log('Cancel clicked');
		      }
		    }, {
		      text: '確認',
		      handler: data => {
		        console.log(data);
		        if (data.mac && typeof data.mac === 'string') {
		           let mm = data.mac.toLowerCase().replace(':','').replace(' ','');
		           if (mm.length === 12) {
		              this.updateState({mac: mm});
		              return true;
		           }else {}
		        } else {}
		        let alert = this.alertCtrl.create({
		          title: '錯誤',
		          subTitle: '請輸入正確的Mac Address',
		          buttons: ['Dismiss']
		        });
		        alert.present();
		      }
		    }
		  ]
		});
		alert.present();
	}

	setMacHistories(mac: string) {
		this.storage.getItem(STORAGE_MAC_HISTORIES)
		.then(list => {
			if (list instanceof Array) {
				let idx = list.indexOf(mac);
				if(idx != -1) {
					list.splice(idx, 1);
				}
				list.unshift(mac);
				this.storage.setItem(STORAGE_MAC_HISTORIES, list).then(() => {}, err => {
					alert(JSON.stringify(err));
				});
			} else {
				let tmp = [mac];
				this.storage.setItem(STORAGE_MAC_HISTORIES, tmp).then(() => {}, err => {
					alert(JSON.stringify(err));
				});
			}
		}, err => {
			let tmp = [mac];
			this.storage.setItem(STORAGE_MAC_HISTORIES, tmp).then(() => {}, err => {
				alert(JSON.stringify(err));
			});
		})
	}
	rmMacHistories(mac: string) {
		this.storage.getItem(STORAGE_MAC_HISTORIES)
		.then(list => {
			if (list instanceof Array) {
				let idx = list.indexOf(mac);
				if(idx != -1) {
					list.splice(idx, 1);
				}
				this.storage.setItem(STORAGE_MAC_HISTORIES, list);
			}
		});
	}
}
