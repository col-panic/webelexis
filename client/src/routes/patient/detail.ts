/********************************************
 * This file is part of Webelexis           *
 * Copyright (c) 2016-2018 by G. Weirich    *
 * License and Terms see LICENSE            *
 ********************************************/

import { Patient } from './../../models/patient';
import { pluck } from 'rxjs/operators';
import { connectTo } from 'aurelia-store';
import { computedFrom } from 'aurelia-binding';

@connectTo(store=>store.state.pipe(pluck("patient")))
export class Detail{
  state
  faelle="../../components/cases"
  tooliconwidth=40
  tooliconheight=40
  toolbar=[
    {
      text: "Stammdaten",
      icon: "/assets/id-card.svg", //basic.png",
      view: "../../components/workflow/patient-basedata"
    },{
      text: "Konsultationen",
      icon: "/assets/folder.svg", //karteikarte.jpg",
      view: "../../components/workflow/encounters"
    },{
      text: "Dokumente",
      icon: "/assets/file.svg", // documents.png",
      view: "../../components/document"
    },{
      text: "Medikamente",
      icon: "/assets/pill.svg", // prescriptions.png"
    },{
      text: "Labor",
      icon: "/assets/laboratory.svg"
    }
  ]
  main=this.toolbar[0].view
  switchTo(view){
    this.main=view
  }

  toggleLeftPane(context){
    context.toggleLeftPane();
  }
  @computedFrom('state')
  get title(){
    if(!this.state){
      return "Kein Patient gewählt"
    }else{
      if(this.state.Bezeichnung1){
        return Patient.getLabel(this.state)
      }else{
        return "Neuer Patient"
      }
    }
  }
}
