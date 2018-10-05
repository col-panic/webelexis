import { StickerType } from './stickers.model';
import { DataSource, DataService } from './../services/datasource';
import { ElexisType } from './elexistype';
import { autoinject } from 'aurelia-framework';

export interface StickerType extends ElexisType{
  Name:string
  importance:string
  imagedata:Int8Array
  foreground:string
  background:string
}


@autoinject
export class StickerManager{
  private stickerService:DataService
  private allStickers={}

  constructor(private ds:DataSource){
    this.stickerService=ds.getService('stickers')
  }

  loadStickers():Promise<any>{
    return this.stickerService.find().then(stickers=>{
      for(const sticker of stickers.data){
        this.allStickers[sticker.Name]=sticker
      }
      return this.allStickers
    })
  }
}
