/* eslint-env mocha */
// indico que es mocha
const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../src/app') // Importa la instancia de Express
const { expect } = chai

chai.use(chaiHttp)

describe('GET /files/data', function () {
  this.timeout(8000) // El servicio externo puede tardar, así como también el entorno local por ello el timeout alto

  it('debe responder con status 200 y un array', async () => {
    const res = await chai.request(app).get('/files/data')

    expect(res).to.have.status(200)
    expect(res.body).to.be.an('array')

    if (res.body.length > 0) {
      const item = res.body[0]
      expect(item).to.have.property('file')
      expect(item).to.have.property('lines').that.is.an('array')
    }
  })

  it('debe permitir filtrar por nombre de archivo válido', async () => {
    const res = await chai.request(app).get('/files/data?fileName=test2.csv')

    expect(res).to.have.status(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.equal(1)
    expect(res.body[0].file).to.equal('test2.csv')
  })

  it('manejo de archivo que no existe', async () => {
    const res = await chai.request(app).get('/files/data?fileName=test123.csv')

    expect(res).to.have.status(404)
    expect(res.body).to.deep.equal({
      code: 'SYS-ERR',
      message: 'Not Found',
      details: null,
      status: 404
    })
  })

  it('debe incluir líneas con campos nulos si includeEmpty=true', async () => {
    const res = await chai
      .request(app)
      .get('/files/data?fileName=test6.csv&includeEmpty=true')

    expect(res).to.have.status(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.equal(1)
    expect(res.body[0].file).to.equal('test6.csv')
    expect(res.body[0].lines).to.be.an('array')

    // Verifico que al menos una línea tenga un campo nulo
    const hasAnyNull = res.body[0].lines.some(line =>
      line.text === null || line.number === null || line.hex === null
    )
    expect(hasAnyNull).to.equal(true)
  })
})
