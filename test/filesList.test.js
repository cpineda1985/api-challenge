/* eslint-env mocha */
// indico que es mocha
const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../src/app') // Importa la instancia de Express
const { expect } = chai

chai.use(chaiHttp)

describe('GET /files/list', function () {
  this.timeout(8000) // El servicio externo puede tardar, así como también el entorno local por ello el timeout alto

  it('debe responder con status 200 y una lista de archivos', async () => {
    const res = await chai.request(app).get('/files/list')

    expect(res).to.have.status(200)
    expect(res.body).to.be.an('object')
    expect(res.body.files).to.be.an('array')
    expect(res.body.files.length).to.be.greaterThan(0)
  })

  it('debe filtrar y devolver un archivo existente', async () => {
    const res = await chai.request(app).get('/files/list?fileName=test2.csv')

    expect(res).to.have.status(200)
    expect(res.body).to.be.an('object')
    expect(res.body.files).to.deep.equal(['test2.csv'])
  })

  it('debe devolver 404 si el archivo no existe', async () => {
    const res = await chai.request(app).get('/files/list?fileName=noexiste.csv')

    expect(res).to.have.status(404)
    expect(res.body).to.have.property('code', 'SYS-ERR')
    expect(res.body).to.have.property('message', 'Not Found')
    expect(res.body).to.have.property('details', 'Archivo no encontrado')
    expect(res.body).to.have.property('status', 404)
  })
})
