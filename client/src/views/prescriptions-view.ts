/********************************************
 * This file is part of Webelexis           *
 * Copyright (c) 2018 by G. Weirich         *
 * License and Terms see LICENSE            *
 ********************************************/

import { BindingSignaler } from 'aurelia-templating-resources';
import { EventAggregator } from 'aurelia-event-aggregator';
import { autoinject, LogManager } from "aurelia-framework";
import { connectTo } from "aurelia-store";
import { State } from "state";
import { pluck } from "rxjs/operators";
import { PrescriptionManager, Modalities } from "models/prescription-model";
import { BriefManager, BriefType } from 'models/briefe-model';
import { DateTime } from 'services/datetime';
import { DocType, DocManager } from '../models/document-model'
import { PatientManager } from 'models/patient';
// import * as html2pdf from 'html2pdf.js'

const log = LogManager.getLogger('prescriptions-view')

@autoinject
@connectTo<State>({
  selector: {
    actPatient: store => store.state.pipe(<any>pluck('patient')),
  }
})
export class Prescriptions {
  mod=Modalities
  log
  searchexpr = ""
  private actPatient
  fixmedi = []
  reservemedi = []
  symptommedi = []
  rezepte = []
  rezept = []
  actrezept = []
  rezeptZusatz: string
  page_header: Element
  c_header: Element
  total
  part
  client


  actPatientChanged(newValue, oldValue) {
    if (newValue && ((!oldValue) || (newValue.id !== oldValue.id))) {
      this.searchexpr = ""
      this.actrezept = undefined
      this.rezept = []
      this.refresh(newValue.id).then(() => {
        this.signaler.signal('selected')
      })

    }
  }

  constructor(private pm: PrescriptionManager, private ea: EventAggregator,
    private signaler: BindingSignaler, private bm: BriefManager,
    private dt: DateTime, private dm: DocManager, private patm: PatientManager) {
  }

  attached() {
    this.total = (window.innerHeight - this.page_header.getBoundingClientRect().height) * .9
    this.part = this.total / 3 - 10
    this.client = this.part - this.c_header.getBoundingClientRect().height - 20
  }

  refresh(id) {

    this.fixmedi = []
    this.symptommedi = []
    this.reservemedi = []
    this.rezepte = []
    // this.rezept = []

    return this.pm.fetchCurrent(id).then(result => {
      this.fixmedi = result.fix
      this.reservemedi = result.reserve
      const rest = result.symptom.sort((a, b) => {
        if (a.Artikel && b.Artikel) {
          const aa = a.Artikel;
          const ba = b.Artikel;
          if (aa.DSCR && ba.DSCR) {
            return aa.DSCR.localeCompare(ba.DSCR)
          } else {
            return 0;

          }
        }
      })
      let sign = rest[0]
      const compacted = []
      for (let i = 0; i < rest.length; i++) {
        const r = rest[i]
        if (r.Artikel && r.Artikel.DSCR) {
          if (r.Artikel.DSCR === sign.Artikel.DSCR) {
            if (r.DateFrom < sign.DateFrom) {
              sign.DateFrom = r.DateFrom
            }
            if (r.DateUntil > sign.DateUntil) {
              sign.DateUntil = r.DateUntil
            }
          } else {
            compacted.push(sign)
            sign = rest[i]
          }
        }
      }
      this.symptommedi = compacted
      this.rezepte = result.rezepte.sort((a, b) => {
        return a[1].date.localeCompare(b[1].date) * -1
      })
    })
  }

  selectRezept(rp?) {
    if (rp) {
      this.actrezept = rp
      this.rezept = rp[1].prescriptions
      this.rezeptZusatz = rp[1].RpZusatz
    }
    setTimeout(() => {
      this.signaler.signal('selected')
      this.signaler.signal('update')
    }, 100)
  }

  createRezept() {
    this.pm.createRezept().then(raw => {
      const rp = [raw.id, {
        date: raw.datum,
        prescriptions: [],
        RpZusatz: raw.RpZusatz
      }]
      this.rezepte.unshift(rp)
      this.selectRezept(rp)
    }).catch(err => {
      console.log(err)
      alert("Konnte kein Rezept erstellen")
    })
  }

  toPdf() {
    let table = "<table>"
    for (const item of this.rezept) {
      const remark = item.Bemerkung ? ("<br />" + item.Bemerkung) : ""
      table += `<tr><td>${item.ANZAHL || ""}</td><td>${item.Artikel.DSCR}${remark}</td><td>${item.Dosis || ""}</td></tr>`
    }
    table += "</table>"
    const fields = [{ field: "liste", replace: table }, { field: "zusatz", replace: this.rezeptZusatz }]
    const rp: BriefType = {
      Datum: this.dt.DateToElexisDate(new Date()),
      Betreff: "Rezept",
      typ: "Rezept",
      MimeType: "text/html",
      patientid: this.actPatient
    }
    this.bm.generate(rp, "rezept", fields).then(html => {
      const win = window.open("", "_new")
      if (!win) {
        alert("Bitte stellen Sie sicher, dass dieses Programm Popups öffnen darf")
      } else {
        win.document.write(html)
        win.print()
        /*
        const domdoc = win.document.body
        const worker=new html2pdf.Worker
        worker.from(domdoc).toPdf().thenExternal(rs=>{
          console.log(rs)
        })*/
        const wlxdoc: DocType = {
          date: rp.Datum,
          payload: html,
          category: "Ausgang",
          concern: this.patm.createConcern(this.actPatient),
          subject: "Rezept"
        }
        this.dm.store(wlxdoc).catch(err => {
          alert("Fehler beim Speichern")
        })
      }
    })
  }

  findId(element) {
    if (element.id.startsWith("card_")) {
      return element.id.subString(5)
    }
    if (element.parentElement.id.startsWith("card_")) {
      return element.parentElement.id.substring(5)
    }
  }

  /*
  dragDrop(event) {
    event.preventDefault()
    const data = event.dataTransfer.getData("text")
    console.log("drop: " + data)
    if (event.currentTarget && event.currentTarget.id) {
      let params: { mode?: string, rezeptid?: string } = {}
      params.mode = event.currentTarget.id.substring(5)
      if (params.mode == "rezept") {
        params.rezeptid = this.actrezept[0];
      }
      this.pm.setMode(data, params).then(updated => {
        setTimeout(() => {
          this.refresh(this.actPatient.id).then(() => {
            if (params.mode == 'rezept') {
              this.rezept.push(updated)
              this.selectRezept(this.actrezept)
            }
          })
        }, 50)

      })
    }
    return true
  }
  */
  dragTrash(event) {
    event.preventDefault()
    return true
  }
  dropTrash(event) {
    event.preventDefault()
    const data = event.dataTransfer.getData("text")
    const typ = event.dataTransfer.getData("wlx")
    this.pm.delete(data).then(removed => {
      if (typ == "rp") {
        const [t, d] = data.split("::")
        const idx = this.rezept.findIndex(el=>el.id==d)
        if (idx != -1) {
          this.rezept = this.rezept.splice(idx, 1)
        }
      }
      this.refresh(this.actPatient.id)
    })
  }
  makePrescription() {
    this.ea.publish("left_panel", "rezept")
    this.ea.publish("rpPrinter", "Hello, World")
  }
}

/*
  set item class according to selection Status (needs signal 'selected')
*/
export class selectionClassValueConverter {
  toView(item, selected) {
    if (selected && (selected[0] == item[0])) {
      return "highlight-item"
    } else {
      return "compactlist"
    }
  }
}
