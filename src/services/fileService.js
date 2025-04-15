const axios = require('axios')
const { parse } = require('csv-parse/sync')

// URL base del API externo
const API_URL = 'https://echo-serv.tbxnet.com/v1/secret'

// Header con la API Key proporcionada (requerido para todas las llamadas)
const AUTH_HEADER = {
  headers: { Authorization: 'Bearer aSuperSecretKey' }
}

/**
 * Función principal para obtener y procesar los archivos
 * @param {string|null} filterName - Nombre del archivo a filtrar, o null para procesar todos
 * @param {boolean} includeEmptyFiles - Si es true, incluye archivos con errores o sin líneas válidas
 * @returns {Promise<Array>} - Arreglo de objetos con la estructura { file, lines }
 */
async function getProcessedFiles (filterName = null, includeEmptyFiles = false) {
  const result = []

  try {
    // Llamada al API externo para obtener la lista de archivos disponibles
    const { data } = await axios.get(`${API_URL}/files`, AUTH_HEADER)
    const files = data.files

    // validando filtro de archivo si se recibe solo se procesa ese, si no, se procesa todo
    const filesToProcess = filterName ? [filterName] : files

    for (const file of filesToProcess) {
      try {
        // Llamada al API externo para obtener el contenido del archivo
        const response = await axios.get(`${API_URL}/file/${file}`, AUTH_HEADER)

        // Parseo y filtro de las líneas dependiendo si se permite incluir vacíos o no
        const lines = parseCSV(response.data, !includeEmptyFiles)

        // Solo se agrega si hay líneas válidas o si se solicita incluir vacíos
        if (includeEmptyFiles || lines.length > 0) {
          result.push({ file, lines })
        }
      } catch (err) {
        // Error específico al procesar un archivo (fallo al obtener o parsear)
        console.warn(`⚠️ Error en procesamiento de archivo ${file}:`, err.message)

        // Si se permite incluir archivos vacíos, se agrega con líneas vacías
        if (includeEmptyFiles) {
          result.push({ file, lines: [] })
        }

        // Se continúa con el siguiente archivo sin interrumpir el procesamiento total
        continue
      }
    }
  } catch (err) {
    // Error global al obtener la lista de archivos
    console.error('Error en obtener lista:', err.message)
    throw err // se propaga el error para que lo capture el controlador
  }

  return result
}

/**
 * Parsea el contenido CSV recibido como texto.
 * @param {string} csvText - Contenido del archivo CSV
 * @param {boolean} strict - Si es true, solo incluye líneas completamente válidas.
 * @returns {Array<Object>} - Arreglo con las líneas filtradas
 */
function parseCSV (csvText, strict = true) {
  try {
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true, // ignorar lineas vacias
      relax_column_count: true // para evitar errores por columnas faltantes o demas
    })

    if (strict) {
      // Filtra solo las filas que cumplan con todos los criterios:
      // - text definido
      // - hex con exactamente 32 caracteres
      // - number numérico y no vacío
      return records.filter(row =>
        row.text &&
        row.hex &&
        row.hex.length === 32 &&
        !isNaN(row.number) &&
        row.number !== ''
      ).map(row => ({
        text: row.text,
        number: Number(row.number),
        hex: row.hex
      }))
    } else {
      // este else es de uso cuando se usa el filtro (includeEmpty=true) transforma todas las filas
      // si falta algún campo, lo asigna como null,  number se convierte a null si no es numérico o está vacío, hex se valida solo si tiene 32 caracteres
      return records.map(row => ({
        text: row.text || null,
        number: (!isNaN(row.number) && row.number !== '') ? Number(row.number) : null,
        hex: row.hex && row.hex.length === 32 ? row.hex : null
      }))
    }
  } catch (err) {
    console.error('Error en obtener data parseo de csv:', err.message)
    return []
  }
}

/**
 * Obtiene la lista de archivos desde el API externo.
 * @param {string|null} fileName - Nombre del archivo a filtrar (opcional)
 * @returns {Promise<{ files: string[] }>}
 * @throws {Error} http 404 si el archivo no existe, se da un response http 500 si falla la conexión
 */
async function getFileList (fileName = null) {
  try {
    // Llamada al API externo para obtener todos los archivos disponibles
    const { data } = await axios.get(`${API_URL}/files`, AUTH_HEADER)
    const allFiles = data.files

    // Si se recibo el filtro
    if (fileName) {
      const found = allFiles.includes(fileName)

      // Si el archivo no está en la lista, se da un response http 404 controlado
      if (!found) {
        const err = new Error('Archivo no encontrado')
        err.statusCode = 404
        throw err
      }

      // Si se encuentra, lo devolvemos en la estructura esperada
      return { files: [fileName] }
    }

    // Si no se filtró, se devuelve la lista completa
    return { files: allFiles }
  } catch (err) {
    // Si ya es un error 404 controlado, lo dejamos pasar
    if (err.statusCode === 404) throw err

    // Para los demas casos response http 500
    console.error('Error al obtener lista de archivos:', err.message)
    const error = new Error('Error al obtener archivos')
    error.statusCode = 500
    throw error
  }
}

module.exports = {
  getProcessedFiles,
  getFileList
}
