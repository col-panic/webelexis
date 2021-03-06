const assert = require('assert');
const app = require('../../src/app');
const chai=require('chai')
chai.should()

describe('\'labresults\' service', () => {
  const labService = app.service('labresults');

  it('registered the service', () => {  
    assert.ok(labService, 'Registered the service');
  });

  it('retrieves results from unittest',async ()=>{
    const patService=app.service('patient')
    const pats=await patService.find({query:{TitelSuffix: "unittest"}})
    const pat=pats.data[0]
    const results=await labService.find({query: {patientId: pat.id}})
    results.should.be.ok
    results.data.length.should.be.gt(0)
  })
  it('skips 2 and limits to 10',async ()=>{
    const patService=app.service('patient')
    const pats=await patService.find({query:{TitelSuffix: "unittest"}})
    const pat=pats.data[0]
    const results= await labService.find({query:{patientId: pat.id,$skip:2,$limit:10}})
    results.should.be.ok
    results.data.length.should.equal(10)
    results.skip.should.equal(2)
  })
});
