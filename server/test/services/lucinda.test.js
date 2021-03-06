const assert = require('assert');
require('chai').should()
const app = require('../../src/app');
const fs=require('fs')
const path=require('path')

/**
 * remove the x from xdescribe, if you have a working lucinda server
 */
xdescribe('\'lucinda\' service', () => {
  let service

  before(() => {
    service = app.service('lucinda');
  })

  it('registered the service', () => {
    assert.ok(service, 'Registered the service');
  });

  it("tests server availability", async () => {
    const pong = await service.get("info")
    pong.should.be.a('string')
    pong.should.include('Lucinda')
  })

  it("indexes a pdf file", async () => {
    const testfile=path.join(__dirname,"../test.pdf")
    const buffer=fs.readFileSync(testfile)
    const doc={
      payload: buffer.toString("base64"),
      some: "thing",
      filename: "test.pdf"
    }
    const created=await service.create(doc)
    created.should.be.ok
    created.should.have.property("statusCode")
    assert(created.statusCode==201,"Statuscode is 201 - created")
    const result=created.body
    result.status.should.equal("ok")
    result._id.should.be.a('string')
    const queried=await service.find({query: "lorem ipsum"})
    queried.status.should.equal("ok")
    queried.result.should.be.an('array')
    queried.result.length.should.be.gt(0)
    const retrieved= await service.get(result._id)
    retrieved.should.be.ok
    const pdf=Buffer.from(retrieved)
    // pdf.should.equal(buffer)
    const deleted=await service.remove(result._id)
    deleted.status.should.equal("ok")
  })
});

