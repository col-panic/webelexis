import {FHIRobject} from "./fhirobj";
import {FHIR_Resource} from "./fhir";
import {FHIR_CodeableConcept} from "./fhir";
export class Medication extends FHIRobject{
  static entities=["code","container","content","form","ingredient","manufacturer"]

  constructor(fhir:FHIR_Resource){
      super(fhir, "Medication")
  }
}