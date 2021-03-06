/********************************************
 * This file is part of Webelexis           *
 * Copyright (c) 2018 by G. Weirich         *
 * License and Terms see LICENSE            *
 ********************************************/

import { autoinject, bindable, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { connectTo } from "aurelia-store";
import * as num from "numeral";
import { pluck } from "rxjs/operators";
import { FlexformConfig } from "../components/flexform";

@connectTo(store => store.state.pipe(pluck("article") as any))
@autoinject
export class ArtikelDetail {
  @bindable
  public article;

  public money = {
    toData: val => num(val).value(),
    toForm: val => num(val).format("0.00"),
  };

  private smallcols = "xs-6 sm-4 md-2";
  private ff: FlexformConfig = {
    title: () => this.title,
    // tslint-disable-next-line object-literal-sort-keys
    attributes: [
      {
        attribute: "DSCR",
        label: this.i18.tr("article.name"),
        sizehint: 12,
      },
      {
        attribute: "PEXF",
        datatype: this.money,
        label: this.i18.tr("article.buy"),
        sizehint: this.smallcols,
      },
      {
        attribute: "PPUB",
        datatype: this.money,
        label: this.i18.tr("article.sell"),
        sizehint: this.smallcols,
      },
      {
        attribute: "PKG_SIZE",
        label: this.i18.tr("article.size"),
        sizehint: this.smallcols,
      },
      {
        attribute: "Istbestand",
        label: this.i18.tr("article.instore"),
        sizehint: this.smallcols,
      },
      {
        attribute: "Maxbestand",
        label: this.i18.tr("article.maxstore"),
        sizehint: this.smallcols,
      },
      {
        attribute: "Minbestand",
        label: this.i18.tr("article.minstore"),
        sizehint: this.smallcols,
      },
      {
        attribute: "Anbruch",
        label: this.i18.tr("article.opened"),
        sizehint: this.smallcols,
      },
    ],
  };

  constructor(private i18: I18N) {}

  @computedFrom("obj")
  get title() {
    return this.i18.tr("article.pagetitle");
  }
}
