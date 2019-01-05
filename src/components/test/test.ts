import { TranslateService } from '@ngx-translate/core';
import { AlertController } from 'ionic-angular';
import { SettingsProvider } from './../../providers/settings/settings';
import {Component, Input, Output, EventEmitter, TemplateRef, ViewChild, HostListener} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {noop} from 'rxjs/util/noop';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {fromPromise} from 'rxjs/observable/fromPromise';

// searchbar default options
const defaultOpts = {
    cancelButtonText: 'Cancel',
    showCancelButton: false,
    debounce: 250,
    placeholder: 'Search',
    autocomplete: 'off',
    autocorrect: 'off',
    spellcheck: 'off',
    type: 'search',
    value: '',
    noItems: '',
    clearOnEdit: false,
    clearInput: false
};

@Component({
  selector: 'ion-auto-complete',
  templateUrl: 'test.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: TestComponent, multi: true}
  ]
})
export class TestComponent implements ControlValueAccessor {

  @Input() public dataProvider: any;
  @Input() public options: any;
  @Input() public disabled: any;
  @Input() public keyword: string;
  @Input() public showResultsFirst: boolean;
  @Input() public alwaysShowList: boolean;
  @Input() public hideListOnSelection: boolean = true;
  @Input() public template: TemplateRef<any>;
  @Input() public useIonInput: boolean;
  @Output() public autoFocus: EventEmitter<any>;
  @Output() public autoBlur: EventEmitter<any>;
  @Output() public itemSelected: EventEmitter<any>;
  @Output() public itemsShown: EventEmitter<any>;
  @Output() public itemsHidden: EventEmitter<any>;
  @Output() public ionAutoInput: EventEmitter<string>;
  @ViewChild('searchbarElem') searchbarElem;
  @ViewChild('inputElem') inputElem;

  private onTouchedCallback: () => void = noop;
  private onChangeCallback: (_: any) => void = noop;
  public defaultOpts: any;
  public suggestions: any[];
  public formValue: any;

  public get showList(): boolean {
      return this._showList;
  }

  public set showList(value: boolean) {
      if (this._showList === value) {
          return;
      }

      this._showList = value;
      this.showListChanged = true;
  }
  public get showListCOVER(): boolean {
    return this._showListCOVER;
  }

  public set showListCOVER(value: boolean) {
      if (this._showListCOVER === value) {
          return;
      }

      this._showListCOVER = value;
      this.showListChanged = true;
  }

  private _showList: boolean;
  private _showListCOVER: boolean;

  private selection: any;
  private showListChanged: boolean = false;

  /**
   * create a new instace
   */
  public constructor(
    public translate: TranslateService,
    private alertCtrl: AlertController,
    private settings: SettingsProvider,
  ) {
      this.keyword = '';
      this.suggestions = [];
      this._showList = false;
      this._showListCOVER = false;
      this.itemSelected = new EventEmitter<any>();
      this.itemsShown = new EventEmitter<any>();
      this.itemsHidden = new EventEmitter<any>();
      this.ionAutoInput = new EventEmitter<string>();
      this.autoFocus = new EventEmitter<any>();
      this.autoBlur = new EventEmitter<any>();
      this.options = {};

      // set default options
      this.defaultOpts = defaultOpts;
  }

  press($e, mac) {
    console.log('press')
    console.log(mac)
    this.deleteHistoryMac(mac)
  }

  pressup($e) {
    console.log('pressup')
  }

  pressed() {
  }

  active($e, mac) {
    this.deleteHistoryMac(mac)
  }

  released() {
  }

  deleteHistoryMac(mac) {
    this.translate.get(['IS_DELETE_MAC']).subscribe(i18n => {
      let alert = this.alertCtrl.create({
        title: i18n['IS_DELETE_MAC'],
        buttons: [
          {
            text: 'No',
            role: 'cancel'
          },
          {
            text: 'Yes',
            role: 'cancel',
            handler: () => {
              this.settings.rmMacFromHistory(mac)
              if(mac.toLowerCase() == this.keyword.toLowerCase()) this.macName = '';
            }
          }
        ]
      })
      alert.present()
    })
  }

  reviseMacName(attrs) {
    // event.stopPropagation()
    // console.log('click me')
    // alert('succ')
    this.translate.get(['INPUT_MACHINE_NAME', '確認', '取消', 'limit_cha', '超過字數限制']).subscribe(i18n => {
      let alert = this.alertCtrl.create({
        title: i18n['INPUT_MACHINE_NAME'],
        subTitle: attrs.label,
        message: i18n['limit_cha'],
        inputs: [
          {
            name: 'machine_name',
            placeholder: attrs.data.macName
          }
        ],
        buttons: [{
          text: i18n['取消'],
          role: 'cancel',
        }, {
          text: i18n['確認'],
          handler: data => {
            if(data.machine_name.length > 10) {
              this.createAlert(i18n['超過字數限制']);
              return false;
            }
            let macName = data.machine_name || attrs.data.macName;
            console.log(macName);
            this.settings.updateMacName({
              macName: macName,
              mac: attrs.label
            }).then(r => {
              console.log('keyword:' + this.keyword)
              console.log('label:' + attrs.label)
              if(attrs.label.toLowerCase() == this.keyword.toLowerCase()) this.macName = macName;
            })
          }
        }]
      })
      alert.present();
    })
  }

  createAlert(alertText) {
    alert(alertText);
  }

  /**
   * handle tap
   * @param event
   */
  public handleTap(event) {
      if (this.showResultsFirst || this.keyword.length > 0) {
          this.getItems();
      }
  }

  public handleSelectTap($event, suggestion): boolean {
      this.select(suggestion);
      $event.srcEvent.stopPropagation();
      $event.srcEvent.preventDefault();
      return false;
  }

  public writeValue(value: any) {
      if (value !== this.selection) {
          this.selection = value || null;
          this.formValue = this.getFormValue(this.selection);
          this.keyword = this.getLabel(this.selection);
      }
  }

  public registerOnChange(fn: any) {
      this.onChangeCallback = fn;
  }

  public registerOnTouched(fn: any) {
      this.onTouchedCallback = fn;
  }

  public updateModel() {
    this.showMacName();
      this.onChangeCallback(this.formValue);
  }

  macName: string = '';
  private showMacName() {
    const mac = this.suggestions.find(m => m.mac.toLowerCase() == this.keyword.toLowerCase());
    if(mac) {
      this.macName = mac.macName;
    } else {
      this.macName = '';
    }
  }

  ngAfterViewChecked() {
      if (this.showListChanged) {
          this.showListChanged = false;
          this.showList ? this.itemsShown.emit() : this.itemsHidden.emit();
          this.showListCOVER ? this.itemsShown.emit() : this.itemsHidden.emit();
      }
  }

  /**
   * get items for auto-complete
   */
  public getItems(e?: Event) {

      let result;

      if (this.showResultsFirst && this.keyword.trim() === '') {
          this.keyword = '';
      } else if (this.keyword.trim() === '') {
          this.suggestions = [];
          return;
      }

      if (typeof this.dataProvider === 'function') {
          result = this.dataProvider(this.keyword);
      } else {
          result = this.dataProvider.getResults(this.keyword);
      }

      // if result is instanceof Subject, use it asObservable
      if (result instanceof Subject) {
          result = result.asObservable();
      }

      if (result instanceof Promise) {
          result = fromPromise(result);
      }

      // if query is async
      if (result instanceof Observable) {
          result
              .subscribe(
                  (results: any[]) => {
                      this.suggestions = results;
                      this.showItemList();
                  },
                  (error: any) => console.error(error)
              )
          ;
      } else {
          this.suggestions = result;
          this.showItemList();
      }

      // emit event
      this.ionAutoInput.emit(this.keyword);
  }

  /**
   * show item list
   */
  public showItemList(): void {
      this.showList = true;
      setTimeout(() => {
        this.showListCOVER = true;
    }, 300);
  }

  /**
   * hide item list
   */
  public hideItemList(): void {
      this.showList = this.alwaysShowList;
      setTimeout(() => {
        this.showListCOVER = this.alwaysShowList;
    }, 300);
  }

  /**
   * select item from list
   *
   * @param event
   * @param selection
   **/
  public select(selection: any): void {
      console.log(selection)
      this.keyword = this.getLabel(selection);
      this.formValue = this.getFormValue(selection);
      this.hideItemList();

      // emit selection event
      this.updateModel();

      if (this.hideListOnSelection) {
          this.hideItemList();
      }

      // emit selection event
      this.itemSelected.emit(selection);
      this.selection = selection;
  }

  /**
   * get current selection
   * @returns {any}
   */
  public getSelection(): any {
      return this.selection;
  }

  /**
   * get current input value
   * @returns {string}
   */
  public getValue() {
      return this.formValue;
  }

  /**
   * set current input value
   */
  public setValue(selection: any) {
      this.formValue = this.getFormValue(selection);
      this.keyword = this.getLabel(selection);
      return;
  }

  /**
   /**
   * clear current input value
   */
  public clearValue(hideItemList: boolean = false) {
    /* yiyo add */
      this.macName = '';
    /************/
      this.keyword = '';
      this.selection = null;
      this.formValue = null;

      if (hideItemList) {
          this.hideItemList();
      }

      return;
  }

  /**
   * set focus of searchbar
   */
  public setFocus() {
      if (this.searchbarElem) {
          this.searchbarElem.setFocus();
      }
  }

  /**
   * fired when the input focused
   */
  onFocus() {
      this.autoFocus.emit();
  }

  /**
   * fired when the input focused
   */
  onBlur() {
      this.autoBlur.emit();
  }

  /**
   * handle document click
   * @param event
   */
  @HostListener('document:click', ['$event'])
  private documentClickHandler(event) {
      if ((this.searchbarElem
              && !this.searchbarElem._elementRef.nativeElement.contains(event.target))
          ||
          (!this.inputElem && this.inputElem._elementRef.nativeElement.contains(event.target))
      ) {
          this.hideItemList();
      }
  }

  private getFormValue(selection: any): any {
      if (selection == null) {
          return null;
      }
      let attr = this.dataProvider.formValueAttribute == null ? this.dataProvider.labelAttribute : this.dataProvider.formValueAttribute;
      if (typeof selection === 'object' && attr) {
          return selection[attr];
      }
      return selection;
  }

  private getLabel(selection: any): string {
      if (selection == null) {
          return '';
      }
      let attr = this.dataProvider.labelAttribute;
      let value = selection;
      if (this.dataProvider.getItemLabel) {
          value = this.dataProvider.getItemLabel(value);
      }
      if (typeof value === 'object' && attr) {
          return value[attr] || '';
      }
      return value || '';
  }
}
