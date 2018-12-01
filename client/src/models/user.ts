import { KontaktType } from './kontakt';
/********************************************
 * This file is part of Webelexis           *
 * Copyright (c) 2016-2018 by G. Weirich    *
 * License and Terms see LICENSE            *
 ********************************************/

import { ElexisType } from './elexistype';
import { autoinject, computedFrom } from "aurelia-framework";
import { DataSource, DataService } from 'services/datasource';
import global from '../user/global'

/**
 * A Webelexis User (which is deliberately not an Elexis-User, but can be linked
 * to an Elexis-User and/or an Elexis-Kontakt)
 * A Webelexis user has an email (which has to be unique) and a set of roles. All other
 * properties are optional.
 */
export interface UserType extends ElexisType {
  email: string
  label?: string
  realname?: string
  elexis_id?: string
  elexisuser_id?: string
  elexiskontakt?: KontaktType
  roles: Array<string>
}

@autoinject
export class UserManager {
  private userService: DataService
  private kontaktService: DataService
  constructor(private ds: DataSource) {
    this.userService = ds.getService('usr')
    this.kontaktService = ds.getService('kontakt')
  }

  hasRole(usr: UserType, role: string): boolean {
    if (role == global.roles.guest) {
      return true
    } else if (usr && usr.roles.indexOf(global.roles.admin) != -1) {
      return true
    } else if (usr) {
      return (usr.roles.indexOf(role) != -1)
    } else {
      return false
    }
  }

  getElexisKontakt(usr: UserType): Promise<KontaktType> {
    if (usr.elexiskontakt) {
      return Promise.resolve(usr.elexiskontakt)
    } else if (usr.elexisuser_id) {
      return this.kontaktService.get(usr.elexisuser_id)
    } else {
      return Promise.reject()
    }
  }
}

@autoinject
export class User {
  obj: UserType

  @computedFrom('obj')
  get label() {
    return this.obj.label
  }

  @computedFrom('obj')
  get email() {
    return this.obj.email
  }
  constructor(data: UserType) {
    this.obj = data
  }

  get roles(): Array<string> {
    return this.obj.roles
  }

  async getElexisUser() {

  }
  hasRole(role: string): boolean {
    return (this.obj.roles.indexOf(role) != -1)
  }
}
