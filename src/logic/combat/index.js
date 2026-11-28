// logic/combat public API: formulas, weapon selection and reach, attack check / preview / resolve, crew changes.
export { band, armorFace, penChance, splashFactor, targetMods, hitChance, wholeDamage } from './formulas.js';
export { firingWeapons, weaponReach } from './weapons.js';
export { canAttack, volleyModel, previewAttack, resolveAttack, canAttackFeature, resolveFeatureAttack } from './attack.js';
export { setMembers, addUpgrade } from './members.js';
