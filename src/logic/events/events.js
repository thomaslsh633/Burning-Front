// Event names and the one builder. An event is a plain object { type, ...payload }: what happened, never display text
// (presentation turns events into text through i18n). Systems add a name here when they first emit it.

export const EVENT = Object.freeze(Object.fromEntries([
  // turn and match
  'TurnStarted', 'TurnEnded', 'MatchEnded',
  // unit state
  'StateChanged', 'UnitCreated', 'UnitRemoved',
  // movement
  'Moved', 'Turned', 'TurretTurned', 'MoveInterrupted',
  // combat
  'Fired', 'ShotMissed', 'ShotHit', 'PenetrationFailed', 'Damaged', 'ModelKilled', 'UnitDestroyed', 'Suppressed', 'AmmoSpent',
  'CounterFired', 'OverwatchFired', 'CriticalInflicted', 'RankGained', 'Retreated',
  // vision
  'Revealed', 'Concealed', 'Spotted',
  // crew and lifecycle
  'Emplacing', 'Emplaced', 'Packing', 'Packed', 'CrewWiped', 'Abandoned', 'Recrewed', 'Captured', 'Wrecked', 'WreckClearing', 'WreckCleared', 'Converted', 'UpgradeFitted', 'Garrisoned', 'Boarded', 'Exited', 'ConstructionStarted', 'ConstructionFinished', 'ResearchStarted', 'ResearchCompleted', 'DoctrineChosen',
  // map features
  'FeatureDamaged', 'FeatureDestroyed', 'StructureCollapsed', 'StructureRebuilding', 'StructureRebuilt', 'WreckPlaced', 'Crushed', 'SmokeLaid',
  // points and economy
  'PointProgress', 'PointNeutralised', 'PointCaptured', 'IncomeReceived', 'UpkeepPaid', 'TicketsLost', 'UnitProduced',
].map(n => [n, n])));

/** Build an event; an unknown type throws, so a typo fails its test. */
export function ev(type, payload = {}) {
  if (!EVENT[type]) throw new Error(`unknown event type ${type}`);
  return { type, ...payload };
}
