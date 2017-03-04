import {bindable} from 'aurelia-framework';

export class SelectControl {
  @bindable public label = '';
  @bindable public items = [];
  @bindable public selectedValue;
  @bindable public isDisabled = false;
  @bindable public displayProp = '';
}
