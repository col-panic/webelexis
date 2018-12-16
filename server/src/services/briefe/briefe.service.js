// Initializes the `briefe` service on path `/briefe`
const createService = require('feathers-knex');
const createModel = require('../../models/briefe.model');
const hooks = require('./briefe.hooks');
const fs = require('fs')
const path = require('path')
const logger = require('../../logger')

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'briefe',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/briefe', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('briefe');

  // auto-import templates
  const cfg = app.get("userconfig")
  if (cfg.docbase) {
    const templatesDir = path.join(cfg.docbase, "templates")
    fs.readdir(templatesDir, (err, files) => {
      if (err) {
        logger.error("could not read template dir " + path.resolve(templatesDir))
      } else {
        const templates = []
        for (const file of files) {
          const basename = path.basename(file, ".html")
          templates.push(matchTemplate(basename))
        }
        Promise.all(templates).then(r => {
          logger.info(`imported ${r.length} templates`)
        })
      }
    })
  }

  const matchTemplate = name => {
    return service.find({ query: { Betreff: name + "_webelexis" } }).then(briefe => {
      if (briefe.data.length > 0) {
        const brief = briefe.data[0]
        if (brief.Path != `templates/${name}.html`) {
          brief.Path = `templates/${name}.html`
          return service.update(brief)
        }
      }else{
        const brief={
          Betreff: name+"_webelexis",
          typ: "Vorlagen",
          Path: `templates/${name}.html`,
          MimeType: "text/html"
        }
        return service.create(brief)
      }
    })
  }
  service.hooks(hooks);
};
