/********************************************
 * This file is part of Webelexis           *
 * Copyright (c) 2016-2018 by G. Weirich    *
 * License and Terms see LICENSE            *
 ********************************************/
const logger = require('../logger')

module.exports = function (app) {
  const db = app.get('knexClient');
  const tableName = 'kontakt';
  db.schema.hasTable(tableName).then(exists => {
    if (!exists) {
      db.schema.createTable(tableName, table => {
        table.string('id', 40).primary().unique().notNullable();
        table.string('istorganisation', 1);
        table.string('istperson', 1)
        table.string('istpatient', 1)
        table.string('istanwender', 1)
        table.string('istmandant', 1)
        table.string('istlabor', 1)
        table.string('land', 3)
        table.string('geburtsdatum', 8)
        table.string('geschlecht', 1)
        table.string('Titel')
        table.string('Bezeichnung1').index()
        table.string('Bezeichnung2').index()
        table.string('Bezeichnung3')
        table.string('Strasse')
        table.string('plz', 10)
        table.string('Ort')
        table.string("Telefon1")
        table.string('Telefon2')
        table.string('fax')
        table.string('NatelNr')
        table.string('Email')
        table.string('Website')
        table.string('gruppe')
        table.string('patientnr', 50)
        table.text('anchrift')
        table.text('bemerkung')
        table.binary('diagnosen')
        table.string('deleted', 1)
        table.integer('LASTUPDATE')
        table.string('TitelSuffix')
      })
        .then(() => {
          logger.info(`Created ${tableName} table`)
          db(tableName).insert({
            id: "007007007",
            Bezeichnung1: "unittest",
            Bezeichnung2: "Elektra",
            geschlecht: "f",
            istpatient: "1",
            istperson: "1",
            geburtsdatum: "19700506",
            deleted: "0",
            lastupdate: new Date().getTime()
          }).then(() => logger.info("added unittest patient"))
        })
        .catch(e => logger.error(`Error creating ${tableName} table`, e));

    }
  });


  return db;
};
