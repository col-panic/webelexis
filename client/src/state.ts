/********************************************
 * This file is part of Webelexis           *
 * Copyright (c) 2018 by G. Weirich         *
 * License and Terms see LICENSE            *
 ********************************************/
import { ElexisType } from "./models/elexistype";
import { User } from "./models/user";
import { DISPLAY } from './routes/dispatch/index';

export interface State {
  user: User;
  termin: ElexisType;
  patient: ElexisType;
  document: ElexisType;
  date: Date;
  panels: DISPLAY;
}

export const webelexisState: State = {
  user: undefined,
  termin: undefined,
  patient: undefined,
  panels: DISPLAY.both,
  document: {},
  date: new Date(),
};
