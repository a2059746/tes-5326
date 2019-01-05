import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter } from '@angular/core';
import { Platform, AlertController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ISubscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/take';
import { NativeStorage } from '@ionic-native/native-storage';
import { Media, MediaObject } from '@ionic-native/media';
export const MinSensorTimeout = 15000;
export enum MachineType {
	// D5326 = 'Tes5326',
	D5327 = 'Tes5327',
	D5328 = 'Tes5328',
	NULL = 'NULL',
}
export const MachineList = [
// 	{
// 	slug: 'TES 5326',
// 	key: MachineType.D5326,
// 	api: '5326',
// },
{
	slug: 'TES 5327',
	key: MachineType.D5327,
	api: '5327',
}, {
	slug: 'TES 5328',
	key: MachineType.D5328,
	api: '5328',
}];
export const _STORAGE_PATH_CURRUNT_STATE = '__CURRENT_STATE__'
export const _STORAGE_PATH_MACHINES_STATE = {
	'Tes5326': '__5326_STATE__',
	'Tes5327': '__5327_STATE__',
	'Tes5328': '__5328_STATE__',
}
export const _BACKGROUND_URL = {
  'Tes5326': './assets/imgs/bg-5326.png',
  'Tes5327': './assets/imgs/bg-53278.png',
	'Tes5328': './assets/imgs/bg-53278.png',
	'NULL': './assets/imgs/bg-white.png',
};
export const _DefaultState: StateType = {
	inited: false,
  mac: null,
  macName: null,
	didEasylink: false,
	machineType: MachineType.D5327,
	bgUrl: _BACKGROUND_URL[MachineType.D5327],
	macHistories: [],
}
export interface StateType {
	inited?: boolean,
	didEasylink?: boolean,
  mac?: string,
  macName?: string,
	machineType?: MachineType,
	bgUrl?: string,
	macHistories?: Array<{
    macName: string,
    mac: string,
    type: string
  }>,
}
export const _ALARM_ID = 'ALARM';
export const _SAMPLE_ALARM_ID = 'TEST';
//const _ALARM_DEFAULT_URI = 'assets/sounds/alarm.mp3';
const _APP_ROUTE_PERFIX = 'file:///android_asset/www/'
const _ALARM_DEFAULT_URI = [
  _APP_ROUTE_PERFIX + 'assets/sounds/alarm1.mp3',
  _APP_ROUTE_PERFIX + 'assets/sounds/alarm2.mp3',
  _APP_ROUTE_PERFIX + 'assets/sounds/alarm3.mp3',
  _APP_ROUTE_PERFIX + 'assets/sounds/alarm4.mp3',
  _APP_ROUTE_PERFIX + 'assets/sounds/alarm5.mp3',
]
const _Default_ALARM_URI = _ALARM_DEFAULT_URI[0];
export const _STORAGE_PATH_ALARM_SOUND_LIST = '__ALARM_SOUND_LIST__'
export const _STORAGE_PATH_SELECTED_ALARM_SOUND = '__SELECTED_ALARM_SOUND__'
@Injectable()
export class SettingsProvider {
	private datastore: {
    data: StateType,
	} = {
		data: _DefaultState
  };
  inited: boolean = false;
  currentAlmUri: string = _Default_ALARM_URI;
  isAlarming: boolean = false; // this parameter is used in 5327/8 page
	private _state: BehaviorSubject<StateType>;
	private state: Observable<StateType>;

	public refreshEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private media: Media,
  	private alertCtrl: AlertController,
  	private platform: Platform,
    private storage: NativeStorage,
  	public http: HttpClient) {
      this._state = <BehaviorSubject<StateType>>new BehaviorSubject({});
			this.state = this._state.asObservable();
			this.platform.ready().then(res => {
        this.initState();
        // this.audioLoad();
        // this.getAlarmSound().then(uri => {
        //   this.audioLoad(_ALARM_ID, uri).then(res => {
        //     this._audioLoaded = true;
        //     this.currentAlmUri = uri;
        //   }, err => {
        //     this._audioLoaded = false;
        //     console.log(err);
        //     alert('audioLoad' + err);
        //   });
        // }, err => {
        //   this.audioLoad(_ALARM_ID, _Default_ALARM_URI)
        // })
        this.getAlarmSound().then(uri => {
          this.currentAlmUri = uri;
        }, err => {

        })
			});
	}

  /** 當前狀態 */

	getState(): Observable<StateType> {
		return this.state;
  }

  getStateFromStorage(): Observable<StateType> {
    return Observable.fromPromise(this.ST_getState());
  }

  // setInit(init) {
	// 	this.updateState({
	// 		inited: init,
	// 	});

  setInit(init) {
    this.inited = init
	}
	rmMacHistory(mac) {
		this.getState().take(1).subscribe(state => {
			let list = state.macHistories;
			if (list instanceof Array) {
				let idx = list.indexOf(mac);
				if(idx != -1) {
					list.splice(idx, 1);
				}
				this.updateState({
					macHistories: list,
				})
			}
		});
  }
  setMac(macObj): Promise<StateType> {
		return new Promise((res, rej) => {
			this.getState().take(1).subscribe(state => {
				try {
					let list = state.macHistories;
					if (list instanceof Array) {
						let idx = list.findIndex(i => i.mac == macObj.mac);
						if(idx != -1) {
							list.splice(idx, 1);
						}
						list.unshift(macObj);
						list = list.slice(0, 5);
						this.updateState({
              mac: macObj.mac,
              macName: macObj.macName,
							macHistories: list,
						}).then(r => {
							res(r);
						});
					} else {
						list = [macObj];
						this.updateState({
              mac: macObj.mac,
              macName: macObj.macName,
							macHistories: list,
						}).then(r => {
							res(r);
						});
					}
				} catch($e) {
					rej($e);
				}

			});
		});
  }
  updateMacName(macObj): Promise<StateType> {
    return new Promise((res, rej) => {
      this.getState().take(1).subscribe(state => {
        console.log(macObj.mac)
        let list = state.macHistories;
        let idx = list.findIndex(i => i.mac.toUpperCase() == macObj.mac);
        console.log('idx:' + idx)
        list[idx].macName = macObj.macName;
        this.updateState({
          mac: state.mac,
          macName: macObj.macName,
          macHistories: list
        }).then(r => {
          res(r)
        })
      })
    })
  }

  rmMacFromHistory(mac) {
    this.getState().take(1).subscribe(state => {
      let list = state.macHistories
      let idx = list.findIndex(i => i.mac.toUpperCase() == mac)
      if(idx != -1) {
        list.splice(idx, 1);
      }
      this.updateState({
        macHistories: list
      })
    })
  }
	// setMac(mac): Promise<StateType> {
	// 	return new Promise((res, rej) => {
	// 		this.getState().take(1).subscribe(state => {
	// 			try {
	// 				let list = state.macHistories;
	// 				if (list instanceof Array) {
	// 					let idx = list.indexOf(mac);
	// 					if(idx != -1) {
	// 						list.splice(idx, 1);
	// 					}
	// 					list.unshift(mac);
	// 					list = list.slice(0, 5);
	// 					this.updateState({
	// 						mac: mac,
	// 						macHistories: list,
	// 					}).then(r => {
	// 						res(r);
	// 					});
	// 				} else {
	// 					list = [mac];
	// 					this.updateState({
	// 						mac: mac,
	// 						macHistories: list,
	// 					}).then(r => {
	// 						res(r);
	// 					});
	// 				}
	// 			} catch($e) {
	// 				rej($e);
	// 			}

	// 		});
	// 	});

	// }
	updateState(state: StateType): Promise<StateType> {
		this.datastore.data = {
			...this.datastore.data,
			...state,
		};
		let t = JSON.parse(JSON.stringify(this.datastore.data));
		this._state.next(t);
		this.ST_saveState(t);
		return Promise.resolve(t);
	}

	/** 裝置歷史資料 */
	changeMachineType(newType: MachineType) {
		return this.updateState({machineType: newType});
		// return new Promise((res, rej) => {
		// 	this.getState().take(1).subscribe(async state => {
		// 		console.log(state);
		// 		/** 儲存當前狀態回自己的MachineType */
		// 		if(!state.machineType) {
		// 		} else {
		// 			await this.ST_saveMachine(state.machineType, state).then(res => {
		// 			}, err => {
		// 				// TODO: BUG HANDLER
		// 				console.log(err);
		// 			})
		// 		}

		// 		/** 切換到新的儲存當前狀態回自己的MachineType */
		// 		await this.ST_getMachine(newType).then(data => {
		// 			this.updateState({
		// 				...data
		// 			});

		// 		}, err => {
		// 			console.log(err);
		// 			this.updateState({
		// 				..._DefaultState,
		// 				machineType: newType,
		// 				bgUrl: _BACKGROUND_URL[newType],
		// 			});
		// 		});
		// 		res(true);
		// 	});
		// });

	}
	/*** native audio plugin has been deleted ***/
	// _audioLoaded = false;
	// audioStop(almId) {
	// 	// if(!this._audioLoaded) { return Promise.resolve('not load'); }
	// 	return this.nativeAudio.stop(almId);
	// }
	// audioLoop(almId) {
	// 	// if(!this._audioLoaded) { return Promise.resolve('not load'); }
	// 	return this.nativeAudio.loop(almId);
	// }
	// public audioLoad(almId, alarm_uri: string) {
  //   // if(this._audioLoaded) { return Promise.resolve(false); }
	// 	return this.nativeAudio.preloadSimple(almId, alarm_uri)

	// 	// if(this._audioLoaded) { return false; }
	// 	// this.nativeAudio
	// 	// .preloadSimple(almId, alarm_uri)
	// 	// .then(res => {
	// 	// 	this._audioLoaded = true;
	// 	// }, err => {
	// 	// 	this._audioLoaded = false;
	// 	// 	console.log(err);
	// 	// 	alert('audioLoad' + err);
	// 	// });
  // }
  // audioUnLoad(almId): Promise<any> {
  //   return this.nativeAudio.unload(almId);
  // }

  /***  ***/
  public saveAlarmSound(uri: string) {
		return this.storage.setItem(_STORAGE_PATH_SELECTED_ALARM_SOUND, uri);
	}
	private getAlarmSound(): Promise<string> {
		return this.storage.getItem(_STORAGE_PATH_SELECTED_ALARM_SOUND)
  }

  public createAlarmSound(uri: string): MediaObject {
    console.log('create audio')
    const audio = this.media.create(uri);
    return audio;
  }

  public playAlarmSound(audio: MediaObject ) {
    console.log('play audio')
    audio.play();
  }

  public stopAlarmSound(audio: MediaObject ) {
    audio.stop();
    audio.release();
  }

  public getAlarmStatus(audio: MediaObject ): Observable<any> {
    return audio.onStatusUpdate
  }

  public getAlarmSoundFromList(): Promise<Array<string>> {
    return new Promise( (resolve, reject) => {
      this.storage.getItem(_STORAGE_PATH_ALARM_SOUND_LIST).then(list => {
        resolve(list)
      }, err => {
        this.saveAlarmSoundToList(_ALARM_DEFAULT_URI).then(list => {
          resolve(list)
        })
      })
    })
  }

  public saveAlarmSoundToList(uriArr: Array<string>) {
    return this.storage.setItem(_STORAGE_PATH_ALARM_SOUND_LIST, uriArr)
  }

  public removeAlarmSoundFromList(uri: string) {
    return new Promise((resolve, reject) => {
      this.storage.getItem(_STORAGE_PATH_ALARM_SOUND_LIST).then((list:Array<string>) => {
        let idx = list.findIndex(i => i == uri)
        if(idx != -1) {
          list.splice(idx, 1);
        }
        this.saveAlarmSoundToList(list).then(list=> {
          resolve(list)
        })
      })
    })
  }

  private initState() {
		this.ST_getState().then((data: StateType) => {
			this.updateState(data);
		}, err => {

			this.updateState(_DefaultState)
		});
	}

	private ST_saveState(state: StateType) {
		return this.storage.setItem(_STORAGE_PATH_CURRUNT_STATE, state);
	}
	private ST_getState(): Promise<StateType> {
		return this.storage.getItem(_STORAGE_PATH_CURRUNT_STATE)
	}

	// private ST_saveMachine(type: MachineType, state: StateType) {
	// 	return this.storage.setItem(_STORAGE_PATH_MACHINES_STATE[type], state);
	// }
	// private ST_getMachine(type: MachineType) {
	// 	return this.storage.getItem(_STORAGE_PATH_MACHINES_STATE[type]);
	// }

}
