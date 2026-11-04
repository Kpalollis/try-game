# Operator Art Assets

The roster contains 385 obtainable operators with a confirmed race from the game-data source. Race names are joined from each operator's handbook entry; operators with missing, undisclosed, or uncertain race data are excluded.

Each operator can use three transparent PNG files in `assets/operators/<character-id>/`:

- `<character-id>-shop.png` - portrait used by the shop, bench, and selected-operator panel.
- `<character-id>-walk.png` - full-body pose used while the operator moves in combat.
- `<character-id>-attack.png` - full-body pose shown during attacks.

For example, the supplied Amiya images map as follows:

- `Pasted Image.png` - pixel-art walk pose used in combat.
- `Pasted Image 2.png` - chibi portrait used by the shop, bench, and selected-operator panel.
- `Pasted Image 3.png` - full-body attack pose shown during attacks.

The game removes flat edge backgrounds in memory and caches the result; original files remain unchanged. Operators without images show an `ART` placeholder rather than substitute character art. Purchases continue to go to the reserve and are not deployed automatically.
