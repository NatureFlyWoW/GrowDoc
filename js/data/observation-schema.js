// GrowDoc Companion — Observation Schema (JSDoc types only)
//
// Defines the shape of Observations produced by the Note Contextualizer
// projection. This is a type-only module: no runtime exports. Every note
// source in GrowDoc (logs, tasks, plant notes, profile wizard answers,
// stage transitions, cure entries) is projected into one of these at
// runtime by `collectObservations` in `note-contextualizer/index.js`.
//
// NOT serialized. No migration. The on-disk data shape is untouched.

/**
 * @typedef {('log'|'task'|'plant'|'profile'|'stage-transition'|'cure'|'wizard'|'override'|'plant-doctor')} ObservationSource
 */

/**
 * @typedef {('nutrients'|'environment'|'pest'|'training'|'phenotype'|'aroma'|'root'|'watering'|'health'|'action-taken'|'question'|'timeline'|'cure-burp'|'cure-dry')} ObservationDomain
 */

/**
 * @typedef {('urgent'|'concern'|null)} SeverityRaw  legacy on-disk enum
 */

/**
 * @typedef {('alert'|'watch'|'info')} SeverityDisplay
 */

/**
 * @typedef {Object} ParsedNote
 * @property {Object}   ctx              extracted field map — filled in section-03
 * @property {Array<{type:string,value:string}>} observations
 * @property {Array<{type:string,value:string}>} actionsTaken
 * @property {string[]} questions
 * @property {string[]} keywords         KEYWORD_PATTERNS rule ids that fired
 * @property {string[]} frankoOverrides  subset of keywords in FRANCO_OVERRIDE_RULE_IDS
 */

/**
 * @typedef {Object} Observation
 * @property {string}           id                    stable hash of source+sourceRefId+rawText
 * @property {string}           createdAt             ISO
 * @property {string}           observedAt            ISO; inferred from log.timestamp, plant.stageStartDate, or createdAt
 * @property {string}           [plantId]             grow.plants[i].id; absent means grow-wide
 * @property {ObservationSource} source
 * @property {string}           [sourceRefId]         id of the parent entity; REQUIRED for every source except 'profile'
 * @property {string}           [wizardStep]          'stage'|'medium'|'lighting'|'strain'|'space'|'priorities' — only when source==='profile'
 * @property {string}           [stageAtObs]          inferred stage at observedAt
 * @property {string}           [flowerWeek]          derived if stage in flower
 * @property {ObservationDomain[]} domains
 * @property {SeverityRaw}      severityRaw
 * @property {SeverityDisplay}  severity
 * @property {boolean}          severityAutoInferred
 * @property {string}           rawText
 * @property {(ParsedNote|null)} parsed               null ONLY if a rule closure threw
 * @property {string[]}         tags
 */

/**
 * @typedef {Object} ObservationIndex
 * @property {number}   version
 * @property {string}   builtAt
 * @property {string}   fromHash        cheap digest of grow + profile for staleness detection
 * @property {Object<string, Observation[]>} byPlant
 * @property {Object<string, Observation[]>} byDomain
 * @property {Observation[]} all
 * @property {Array<{obsId:string, ruleId:string, error:string, timestamp:string}>} ruleErrors
 */

export {};
