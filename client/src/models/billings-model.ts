import { EncounterType } from './encounter';
import { DataSource, DataService } from './../services/datasource';
import { ElexisType } from './elexistype';
import { autoinject } from 'aurelia-framework';

export interface BillingType extends ElexisType{
  behandlung: string
  leistg_txt: string
  leistg_code: string
  klasse: string
  zahl: string
  vk_preis: string
}

@autoinject
export class BillingsManager{
  billingService:DataService

  constructor(private ds:DataSource){
    this.billingService=this.ds.getService('billing')
  }

  async getBillings(kons:EncounterType){
    const ret= await this.billingService.find({query:{behandlung:kons.id}})
    return ret.data.map(b=>new BillingModel(b))
  }
}

export class BillingModel{
  constructor(private obj:BillingType){}
  getLabel(){
    const code=this.obj.leistg_code.split(/\s*-\s*/)
    return this.obj.zahl+" "+code[0]+" "+this.obj.leistg_txt
  }

}
