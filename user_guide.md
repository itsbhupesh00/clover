# Project Clover User Guide

Explore Mars, drive the Korolev Crater rover, and play the sample-return game.

## Open

Open the [Mars information page](index.html), [rover simulator](main.html), or [mission game](game/game.html).

To run locally, start a server from the project folder:

```powershell
py -m http.server 8000
```

If needed, use `python -m http.server 8000`. Visit `http://localhost:8000/`. Keep the folder structure intact; some resources require internet access.

## Information page

Use **Next**, **Previous**, or the top step buttons to browse Mars facts, mission history, and Korolev Crater. Try the weight calculator by entering a value or moving its slider. The NASA rover image is an archive image, not a live feed; a local animation appears if it cannot load.

## Rover simulator

Use the buttons to switch camera (**Orbit**, **Follow**, **Cockpit**) and terrain layer (**Photo**, **Elevation**, **Danger**, **MOLA**). Press **Play** or drag the route slider to move along the route; **Restart** returns to the start. Adjust rover speed and the thresholds under **Settings**. Drag to look around and scroll to zoom.

The HUD and danger colors show estimated position, terrain, slope, sunlight, and route information. MOLA is a coarse reference layer; the route and danger calculations use HRSC terrain.

## Mission game

Open **Menu**, choose an unlocked level, then press **Start level**. Gather water, food, fuel, and pouches; board the rover, press **Q** to scan, and collect required samples on foot while standing still. Return to the launch pad, park by the rocket, and press **C** when mission requirements are met. Later levels include a relay rendezvous. Levels unlock in order; **Reset progress** erases saved progress.

| Input | Action |
| --- | --- |
| `WASD` / arrows | Drive or walk |
| `Shift` / `Space` | Boost / jump on foot |
| `E` / `Q` | Collect a sample / scan |
| `F` / `C` | Board or exit rover / launch |
| Drag | Look around |

Touch controls are also available. Surface water, food, oxygen, and fuel are limited; the habitat's production demo does not refill mission supplies.

## Troubleshooting

If a page or asset fails to load, run the project from the local server above, check that its folders are in place, and verify your internet connection.

