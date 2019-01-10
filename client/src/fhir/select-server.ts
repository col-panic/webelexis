/********************************************
 * This file is part of Webelexis           *
 * Copyright (c) 2016-2019 by G. Weirich    *
 * License and Terms see LICENSE            *
 ********************************************/

import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";

@autoinject
export class SelectServer {
  private url: string;

  constructor(protected controller: DialogController) {}

  public activate(params) {
    this.url = params.url;
  }
}
