/********************************************
 * This file is part of Webelexis           *
 * Copyright (c) 2016-2018 by G. Weirich    *
 * License and Terms see LICENSE            *
 ********************************************/

import {customElement} from 'aurelia-framework'
import {EventAggregator} from 'aurelia-event-aggregator'
import * as moment from 'moment'
import 'moment/locale/de'
import * as Pikaday from 'pikaday';
import {autoinject, bindable} from 'aurelia-framework'
import {I18N} from 'aurelia-i18n'

/**
 * Turn pikdate (https://github.com/dbushell/Pikaday) in an Aurelia Component.
 * Publishes a 'datepicker' event on the Aurelia EventAggregator on date changes.
 */
@customElement('pickdate')
@autoinject
export class PickDate {
  pikhome: HTMLInputElement
  element: any
  private pa: Pikaday
  @bindable actDate: string
  @bindable pickerdate: string
  @bindable actMoment: moment.Moment
  private calendarNames = {
    previousMonth: this.tr.tr('calendar.previousMonth'),
    nextMonth    : this.tr.tr('calendar.nextMonth'),
    months       : [],    // make typescript compiler happy
    weekdays     : [],
    weekdaysShort: []
  }


  constructor(private ea: EventAggregator, element: Element, private tr: I18N) {
    const _self = this
    this.element = element;
    let months = []
    for (let i = 0; i < 12; i++) {
      months.push(this.tr.tr('calendar.months.' + i)
      )
    }
    this.calendarNames['months'] = months
    let weekdays = []
    let weekdaysShort = []
    for (let i = 0; i < 7; i++) {
      weekdays.push(this.tr.tr('calendar.weekdays.' + i))
      weekdaysShort.push(this.tr.tr('calendar.weekdaysShort.' + i))

    }
    this.calendarNames['weekdays'] = weekdays
    this.calendarNames['weekdaysShort'] = weekdaysShort
    this.pickerdate = moment().format("DD.MM.YYYY")
    this.pa = new Pikaday({
      //field: this.pikhome,
      i18n    : _self.calendarNames,
      position: "bottom right",
      onSelect: function () {
        // console.log("selected " + this.getDate())
        _self.actDate = moment(this.getDate()).format("dd, DD.MM.YYYY")
        _self.actMoment=moment(this.getDate())
        _self.ea.publish('datepicker', {oldDate: new Date(), newDate: this.getDate()})
        this.hide()
      }
    })
    this.element.parentNode.insertBefore(this.pa.el, this.element.nextSibling)

  }

  attached() {
    this.pa.setDate(moment(this.pickerdate, ["DD.MM.YYYY", "YYYYMMDD", "YYYY-MM-DD"]).format())
  }

  show() {
    this.pa.show()
  }

  /**
   * Set the date one day forward
   */
  forward() {
    let act = moment(this.pa.getDate())
    act.add(1, "days")
    this.pa.setDate(act.format())
  }

  /**
   * set the date one day backward
   */
  back() {
    let act = moment(this.pa.getDate())
    act.add(-1, "days")
    this.pa.setDate(act.format())
  }
}
