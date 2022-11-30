import cvss2js from 'cvss2js'
import * as cvss2 from '../../../csaf-validator-lib/lib/shared/cvss2.js'

/** @typedef {(typeof cvss2.mapping)[number][0]} CVSSField */
/** @typedef {(typeof cvss2.mapping)[number][1]} CVSSVectorStringKey */
/** @typedef {keyof (typeof cvss2.mapping)[number][2]} CVSSValue */

/**
 * @param {Vector} vector
 * @template {Record<string, string>} Vector
 */
export function vectorUpdateFromVectorString(vector) {
  const { vectorString } = vector
  if (typeof vectorString !== 'string') return vector
  const vectorStringMap = vectorString
    .split('/')
    .map((k) => {
      const [key, value] = k.split(':')
      const mapping = cvss2.mapping.find((m) => m[1] === key)
      console.log({ mapping })
      if (!mapping) return null
      const valueMapping = new Map(
        Array.from(
          /** @type {Iterable<[String, { id: string; score: number }]>} */ (
            Object.entries(mapping[2])
          )
        ).map(([key, value]) => [value.id, key])
      )

      const vectorKeyName = mapping[0]
      const vectorField = valueMapping.get(value)
      if (vectorField === undefined) return null
      return /** @type {const} */ ([vectorKeyName, vectorField])
    })
    .filter(
      /**
       * @returns {entry is [readonly CVSSField, string]}
       */
      (entry) => Boolean(entry)
    )

  // Apply updates only if necessary to keep referential transparency
  return vectorStringMap.reduce(
    (vector, entry) =>
      vector[entry[0]] !== entry[1]
        ? { ...vector, [entry[0]]: entry[1] }
        : vector,
    vector
  )
}

/**
 * @param {Record<string, string | undefined>} vector
 * @returns {string}
 */
export function vectorGetVectorString(vector) {
  const vectorMapping = new Map(Object.entries(vector))
  const f = cvss2.mapping
    .map((entry) => {
      /** @type {Map<string, { id: string }>} */
      const valueMapping = new Map(Object.entries(entry[2]))
      const vectorValue = vectorMapping.get(entry[0])
      return /** @type {const} */ ([
        entry[1],
        vectorValue !== undefined
          ? valueMapping.get(vectorValue)?.id
          : undefined,
      ])
    })
    .filter(
      /**
       * @returns {entry is [CVSSVectorStringKey, string]}
       */
      (entry) => entry[1] !== undefined
    )
    .map((entry) => entry.join(':'))
  return f.join('/')
}

/**
 * @param {Vector} vector
 * @returns {Vector}
 * @template {Record<string, string | undefined>} Vector
 */
export function vectorUpdateVectorString(vector) {
  const vectorString = vectorGetVectorString(vector)
  return {
    ...vector,
    vectorString,
  }
}

/**
 * @param {Vector} vector
 * @returns {Vector}
 * @template {Record<string, string | undefined>} Vector
 */
export function vectorUpdateBaseScore(vector) {
  let updatedVector = vector
  const { vectorString } = updatedVector
  try {
    if (typeof vectorString !== 'string') throw new Error()
    const baseScore = cvss2js.getBaseScore(vectorString)
    updatedVector = { ...updatedVector, baseScore }
  } catch (_e) {
    updatedVector = { ...updatedVector, baseScore: undefined }
  }
  return updatedVector
}

/**
 * @param {Vector} vector
 * @returns {Vector}
 * @template {Record<string, string | undefined>} Vector
 */
export function vectorUpdateTemporalScore(vector) {
  let updatedVector = vector
  const { vectorString } = updatedVector
  try {
    if (typeof vectorString !== 'string') throw new Error()
    const temporalScore = cvss2js.getTemporalScore(vectorString)
    updatedVector = { ...updatedVector, temporalScore }
  } catch (_e) {
    updatedVector = { ...updatedVector, temporalScore: undefined }
  }
  return updatedVector
}

/**
 * @param {Vector} vector
 * @returns {Vector}
 * @template {Record<string, string | undefined>} Vector
 */
export function vectorUpdateEnvironmentalScore(vector) {
  let updatedVector = vector
  const { vectorString } = updatedVector
  try {
    if (typeof vectorString !== 'string') throw new Error()
    const environmentalScore =
      cvss2.getEnvironmentalScoreFromVectorString(vectorString)
    updatedVector = { ...updatedVector, environmentalScore }
  } catch (_e) {
    updatedVector = { ...updatedVector, environmentalScore: undefined }
  }
  return updatedVector
}
