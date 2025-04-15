const express = require('express')
const router = express.Router()
const { getProcessedFiles, getFileList } = require('../services/fileService')

/**
 * GET /files/data
 * Endpoint de archivos procesados.
 * Permite filtrar por nombre de archivo fileName
 * y controlar si se incluyen archivos vacíos includeEmpty.
 * Soporta paginación mediante limit y offset (cuando no se usa fileName).
 */
router.get('/data', async (req, res) => {
  try {
    const { fileName, includeEmpty } = req.query
    const includeEmptyFiles = includeEmpty === 'true'

    // Llama al servicio para obtener archivos procesados
    const data = await getProcessedFiles(fileName, includeEmptyFiles)

    // Validación de archivo específico no encontrado
    if (fileName && !includeEmptyFiles && data.length === 0) {
      return res.status(404).json({
        code: 'SYS-ERR',
        message: 'Not Found',
        details: null,
        status: 404
      })
    }

    // Si no se usa fileName, aplicar paginación offset y limit para mostrar n resultados
    // solo valida fileBame funciona con filtro includeEmptyFiles
    if (!fileName) {
      const limit = parseInt(req.query.limit, 10) || data.length
      const offset = parseInt(req.query.offset, 10) || 0
      const paginatedData = data.slice(offset, offset + limit)
      return res.status(200).json(paginatedData)
    }

    // Si hay fileName, devolver sin paginación
    res.status(200).json(data)
  } catch (err) {
    console.error('❌ Error en /files/data:', err.message)
    res.status(500).json({
      code: 'SYS-ERR',
      message: 'Internal Server Error',
      details: err.message,
      status: 500
    })
  }
})

/**
 * GET /files/list
 * Endpoint para obtener la lista de archivos disponibles directamente desde el API externo.
 * También puede filtrar por `fileName`, devolviendo solo ese si existe.
 */
router.get('/list', async (req, res) => {
  try {
    const { fileName } = req.query
    const data = await getFileList(fileName)

    res.status(200).json(data)
  } catch (err) {
    const status = err.statusCode || 500
    const message = status === 404 ? 'Not Found' : 'Error al obtener lista de archivos'

    res.status(status).json({
      code: 'SYS-ERR',
      message,
      details: err.message,
      status
    })
  }
})

module.exports = router
