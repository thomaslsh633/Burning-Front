# Burning Bridges — unit model (reference notes)

From `thomaslsh633/burning-bridge-data` (`lua/Constants.lua`, strings in `level_units.dat`). Mechanics only;
no assets, maps, levels or text are copied into Burning Front.

- A unit template is a list of **components**: ROTATION, MOVEMENT, ATTACK_HANDLER, ATTACK, DEALER, CAPTURE,
  SUPPLY, SUPPLIER, SUPPLYABLE, FORTIFY, CAMOUFLAGE, MINE_LAYER, DISARM_MINE, DETECT_MINE, BUILDER, HUD,
  BRIDGE_HANDLER, TRANSFORM, SELFDESTROY. A unit can do something only if it has the component.
- Damage is set per **target category** (UNIT_CAT_INFANTRY, _TANK, _TRUCK, _ARTILLERY, _BUNKER, _AIR, _BRIDGE …).
- Facing has six directions (hex sides).
- Unit numbers are in binary `.dat` files; reading them needs a parser (not written).

Burning Front uses the same idea: a unit's optional data blocks (`move`, `attack`, `capture`, `build`, …)
each map to one system in `src/logic/`.
