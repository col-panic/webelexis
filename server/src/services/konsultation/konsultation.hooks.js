/********************************************
 * This file is part of Webelexis           *
 * Copyright (c) 2016-2018 by G. Weirich    *
 * License and Terms see LICENSE            *
 ********************************************/

const { authenticate } = require('@feathersjs/authentication').hooks;
const ElexisUtils = require('../../util/elexis-types')
const util = new ElexisUtils()
const Samdas = require('@rgwch/samdastools')
const logger = require('winston')

/*
const withPatientId=function (options={}){
  return async context=>{
    if(context.params.query && context.params.query.patientId){
      let pid=context.params.query.patientId
      delete context.params.query.patientId
      const query=context.service.createQuery(context.params).join('faelle','behandlungen.fallid','=','faelle.id')
        .where({"faelle.patientid":pid}).orderBy('behandlungen.datum','desc')
      context.params.knex=query
    }
    return context
  }
}
*/

const withPatientId = async context => {
  if (context.params.query && context.params.query.patientId) {
    const pid = context.params.query.patientId
    delete context.params.query.patientId
    const fallService = context.app.service('fall')
    const faelle = await fallService.find({ query: { patientid: pid, $select: ['id'] } })
    const fallids = faelle.data.map(fall => {
      return {
        fallid: fall.id
      }
    })
    if (fallids && fallids.length > 0) {
      context.params.query.$or = fallids
    } else {
      context.params.query.fallid = "--"
    }
    if (!context.params.query.deleted) {
      context.params.query.deleted = "0"
    }
    context.params.query.$sort = {
      datum: -1
    }
    //const qq=context.app.service('konsultation').createQuery({query: context.params.query})
    //logger.silly(qq.toString())
    return context
  }
}
const doSort = context => {
  const query = context.app.service('konsultation').createQuery({ query: context.params.query });
  query.orderBy('datum', 'desc');
  context.params.knex = query
  return context
}
/**
 * Hook to apply after find()
 * Convert encounter entries from Elexis internal VersionedResource/Samdas to
 * html (of the latest Version)
 */
const readKonsText = context => {
  const raw = context.result
  const cooked = []
  if (raw && raw.data) {
    const entries = []
    for (let kons of raw.data) {
      const entry = util.getVersionedResource(kons.eintrag)
      if (entry.text) {
        entries.push(Samdas.toHtml(entry.text))
      } else {
        entries.push("<p>?</p>")
        logger.error("Empty record " + kons.id)
      }
      kons.eintrag = {
        remark: entry.remark,
        timestamp: entry.timestamp
      }
    }
    return Promise.all(entries).then(converted => {
      converted.forEach((entry, index) => {
        raw.data[index].eintrag.html = entry
      })
      return context
    }).catch(err => {
      logger.error("Error reading kons Text " + err)
    })
  }
}

/**
 * Hook to apply before update. Convert HTML to Samdas and update the encpunter's
 * VersionedResource
 */
const updateKonsText = async context => {
  try {
    const html = context.data.eintrag.html
    if (html) {
      const samdas = Samdas.fromHtml(html)
      if (samdas) {
        const kons = await context.service.get(context.data.id)
        let versionedResource = kons.eintrag
        if (!versionedResource) {
          versionedResource = util.createVersionedResource()
        } else {
          const entry = util.getVersionedResource(versionedResource)
          if (!entry.text) {
            versionedResource = util.createVersionedResource()
          }
        }
        const vrUpdated = util.updateVersionedResource(versionedResource, samdas, context.data.eintrag.remark)
        context.data.eintrag = Buffer.from(vrUpdated)
      } else {
        logger.warning("converting html to samdas " + html)
      }
    }
    return context
  } catch (err) {
    logger.error("Updating kons " + err)
    throw new Error("Could not store " + JSON.stringify(context.data.eintrag))
  }
}
module.exports = {
  before: {
    all: [ /* authenticate('jwt') */],
    find: [withPatientId],
    get: [],
    create: [],
    update: [updateKonsText],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [readKonsText],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};