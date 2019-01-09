import { IFhirAdapter } from "fhir/fhir-api";
import { FHIR_Patient } from "fhir/model/fhir";
import { PatientType } from "models/patient";
import { Helper } from "./helper";
import { ElexisType } from "models/elexistype";

export class PatientAdapter implements IFhirAdapter {
  public toElexisObject(fhirpat: FHIR_Patient) {
    const name = Helper.getName(fhirpat.name);
    const addr = Helper.getAddress(fhirpat.address, "home");
    const comm = Helper.getComm(fhirpat.telecom, "home");
    const ret: PatientType = {
      id: fhirpat.id,
      Bezeichnung1: name.Bezeichnung1,
      Bezeichnung2: name.Bezeichnung2,
      Bezeichnung3: name.Bezeichnung3,
      geburtsdatum: "",
      geschlecht: "m",
      strasse: addr.street,
      plz: addr.zip,
      ort: addr.place,
      telefon1: comm.phone,
      email: comm.mail
    };
  }

  public toFhirObject(obj: ElexisType){
    return null
  }

  public toQueryResult(bundle){
    return null
  }
}
