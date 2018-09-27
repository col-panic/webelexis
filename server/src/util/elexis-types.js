/***************************************
 * This file is part of Webelexis(tm)
 * Copyright (c) 2017 by G. Weirich.
 * All rights reserved.
 ***************************************/

/**
 * Class for access to some elements specific to Elexis:
 *
 * VersionedResource is a binary format that holds several (practically unlimited) versions of a Text, each marked
 * with a version number and a user-supplied remark.
 *
 * ExtInfo is a compressed Java Hashtable to store fields not available in the database
 *
 * Both data types are highly java specific, and so instead of decrypting them "manually", we simply call
 * appropriate java methods via node-java.
 *
 */

const java = require('java')
const moment = require('moment')
const JSZip = require('jszip')

/* generate dependencies with
   mvn dependency:copy-dependencies
   */
const utils = "rgw-toolbox-4.2.5.jar"
const ann = "jackson-annotations-2.7.0.jar"
const jackson = "jackson-core-2.7.4.jar"
const databind = "jackson-databind-2.7.4.jar"

const libdir = "../../lib"
/*
export interface IVersionedResource {
  text: string,
  remark: string,
  timestamp: string,
  version: number
}
*/
class ElexisUtils {

  constructor() {
    let path = require('path');
    let fs = require('fs');
    java.classpath.push(path.join(__dirname, libdir, utils));
    java.classpath.push(path.join(__dirname, libdir, jackson));
    java.classpath.push(path.join(__dirname, libdir, databind));
    java.classpath.push(path.join(__dirname, libdir, ann));



    if (!fs.existsSync(path.join(__dirname, libdir,utils))) {
      throw new Error(`${libdir}/${utils} not found!`)
    }

  }

  /**
   * create an empty versionedResource
   */
  createVersionedResource() {
    let vr = java.callStaticMethodSync("ch.rgw.tools.VersionedResource", "load", null)
    let bindata = java.callMethodSync(vr, "serialize")
    return bindata
  }

  /**
   * Get the head revision of a VersionedResource
   * @param bindata: The binary data
   * @returns string: The head revision as (Samdas-)text
   * */
  getVersionedResource(bindata) {
    if (bindata && bindata.length) {
      let array = java.newArray("byte",
        Array.prototype.slice.call(bindata, 0)
      )
      let vr = java.callStaticMethodSync("ch.rgw.tools.VersionedResource", "load", array)
      let entry = java.callMethodSync(vr, "getHead")
      let lastVersion = java.callMethodSync(vr, "getHeadVersion")
      let item = java.callMethodSync(vr, "getVersion", lastVersion)
      let label = java.callMethodSync(item, "getLabel")
      var sl = label.split(/\s*-\s*/)

      return {
        text: entry,
        remark: sl[1],
        timestamp: moment(sl[0], "DD.MM.YYYY, HH:mm:ss").format(),
        version: lastVersion
      }
    } else {
      return {
        text: "?",
        remark: "?",
        timestamp: moment().format(),
        version: 0
      }
    }
  }

  /**
   * Add a new entry to a VersionedResource
   * @param entry
   * @param newText
   * @param remark
   * @returns {*}
   */
  updateVersionedResource(entry, newText, remark) {
    let array = java.newArray("byte",
      Array.prototype.slice.call(entry, 0)
    )
    let vr = java.callStaticMethodSync("ch.rgw.tools.VersionedResource", "load", array)
    java.callMethodSync(vr, "update", newText, remark)
    let binfield = java.callMethodSync(vr, "serialize")
    return binfield
  }

  getExtInfo(buffer) {
    let array = java.newArray("byte",
      Array.prototype.slice.call(buffer, 0)
    )

    let extInfo = java.callStaticMethodSync("ch.rgw.tools.ExtInfo", "fold", array)
    if (extInfo) {
      let jsonstring = java.callStaticMethodSync("ch.rgw.tools.ExtInfo", "toJson", extInfo)
      return JSON.parse(jsonstring)
    }
    return {}
  }

  writeExtInfo(obj) {
    let str = JSON.stringify(obj)
    /*
    const zip=new JSZip()
    zip.file("json", str)
    return zip.generateAsync({"type": "nodebuffer"})
*/
    return java.callStaticMethodSync("ch.rgw.tools.ExtInfo", "flattenFromJson", str)
  }

  dateStrings(date) {
    var month = (date.getMonth() + 1).toString();
    if (month.length < 2) {
      month = '0' + month
    }
    var day = date.getDate().toString();
    if (day.length < 2) {
      day = '0' + day
    }
    return {
      "year": date.getFullYear().toString(),
      "month": month,
      "day": day
    }
  }

  // create a YYYYMMDD String from a Date object
  makeCompactFromDateObject(date) {
    var ret = this.dateStrings(date)
    return ret.year + ret.month + ret.day
  }

  // Create a Date object from a YYYYMMDD String
  makeDateObjectFromCompact(datestring) {
    if (datestring !== undefined && datestring.length === 8) {
      let year = parseInt(datestring.substring(0, 4))
      let month = parseInt(datestring.substring(4, 6)) - 1
      let day = parseInt(datestring.substring(6, 8))
      return new Date(year, month, day)
    } else {
      return ""
    }
  }

  // Create a Date object from a dd.mm.yyyy String
  makeDateObjectFromLocal(datestring) {
    if (datestring !== undefined) {
      var ar = datestring.split(".")
      var yr = parseInt(ar[2])
      if (yr < 30) {
        yr += 2000
      } else if (yr < 100) {
        yr += 1900
      }
      return new Date(yr, parseInt(ar[1]) - 1, ar[0])
    } else {
      return new Date()
    }
  }

  // make a hh:mm String from a number of minutes
  makeTime(minutes) {
    let hours = Math.floor(minutes / 60)
    let rest = minutes - (hours * 60)
    let mins = rest.toString()
    let hoursS = hours.toString()
    if (hoursS.length < 2) {
      hoursS = "0" + hours
    }
    if (mins.length < 2) {
      mins = "0" + mins
    }

    return hoursS + ":" + mins
  }

  // make a number of minutes from a hh:mm String
  makeMinutes(timeString) {
    var hm = timeString.split(":")
    var ret = parseInt(hm[0]) * 60 + parseInt(hm[1])
    return ret;
  }

  // make a YYYY-MM-DD String from a Date object
  makeDateRFC3339(date) {
    var ret = this.dateStrings(date)
    return ret.year + "-" + ret.month + "-" + ret.day
  }

  // make a dd.mm.yyyy String from a Date object
  makeLocalFromDateObject(date) {
    var ret = this.dateStrings(date)
    return ret.day + "." + ret.month + "." + ret.year
  }

  // make a dd.mm.yyyy from yyyymmdd
  makeLocalFromCompact(ed) {
    if (ed === undefined || ed === null || ed.length != 8) {
      return ""
    } else {
      return ed.substring(6, 8) + "." + ed.substring(4, 6) + "." + ed.substring(0, 4)
    }

  }

  makeCompactFromLocal(lc) {
    if (lc === undefined || lc === null) {
      return ""
    } else {
      return this.makeCompactFromDateObject(this.makeDateObjectFromLocal(lc))
    }
  }

  elexisTimeStamp(date) {
    return (Math.round(date.getTime() / 60000)).toString()
  }
}

module.exports = ElexisUtils