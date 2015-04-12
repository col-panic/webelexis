/**
 ** This file is part of Webelexis
 ** (c) 2015 by G. Weirich
 */
define(['knockout', 'app/eb', 'app/config', 'text!tmpl/ch-webelexis-addpatient.html', 'app/datetools', 'jquery', 'validate', 'domReady!'], function (ko, bus, cfg, html, dt, $) {
    function AddPatientModel() {
        var self = this
        self.title = "Daten erfassen"
        self.data = ko.observable({
            vorname: "",
            name: "",
            geburtsdatum: "",
            strasse: "",
            plz: "",
            ort: "",
            email: "",
            telefon: "",
            mobil: "",
            krankenkasse: "",
            versicherungsnummer: "",
            pwd: "",
            pwdrep: ""
        })

        self.send = function () {
            // send request only if validate is okay. Cpnvert birthdate to Elexis format.
            if (self.vtor.numberOfInvalids() == 0) {
                console.log(JSON.stringify(self.data()))
                var payload = self.data()
                var date = dt.makeDateFromlocal(payload.geburtsdatum)
                payload.geburtsdatum = dt.makeCompactString(date)
                payload.sessionID = cfg.sessionID
                payload.username = payload.email
                bus.send("ch.webelexis.patient.add", payload, function (result) {
                    if (result === undefined) {
                        alert("Verbindungsfehler")
                    } else if (result.status === "ok") {
                        console.log("ok")
                    } else {
                        console.log(result.status)
                        console.log(result.message)
                    }
                })
            } else {
                console.log("not sending: invalid fields: " + self.vtor.numberOfInvalids())
            }
        }

        self.accountDisplay = ko.observable("pneu")

        self.vtor = $("#eingabe").validate({
            debug: true,
            rules: {
                vorname: "required",
                name: "required",
                geburtsdatum: {
                    required: true,
                    datum: "true"

                },
                email: {
                    required: true,
                    mailaddr: true
                },
                pwd: {
                    required: true,
                    minlength: 5
                },
                pwdrep: {
                    required: true,
                    equalTo: "#pwd"
                }

            },
            messages: {
                vorname: "Bitte geben Sie Ihren Vornamen an",
                name: "Bitte geben Sie Ihren Namen an",
                geburtsdatum: "Die Angabe des Geburtsdatums ist erforderlich (t.m.j)",
                email: "Die korrekte Mail-Adresse wird als Login-Name benötigt.",
                password: "Ein mindestens 5 Zeichen langes Passwort muss eingetragen werden",
                pwdrepeat: {
                    required: "Bitte bestätigen Sie Ihr Passwort hier.",
                    equalTo: "Die Passwoörter sind nicht identisch"
                }
            }
        })

        $.validator.addMethod("datum", function (act, element, params) {
            var pattern = /^\d{1,2}\.\d{1,2}\.(?:\d{4}|\d{2})$/
            return (pattern.exec(act) != null)
        }, "Bitte Datum in der Form tag.monat.jahr eingeben")

        $.validator.addMethod("mailaddr", function (act, element, params) {
            var pattern = /\w+@[a-zA-Z_0-9\.]*[a-zA-Z_0-9]{2,}\.[a-zA-Z]{2,3}/
            return (pattern.exec(act) != null)
        })

    }
    return {
        viewModel: AddPatientModel,
        template: html
    }
});