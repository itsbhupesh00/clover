# Project Clover

Project Clover is a browser-based Mars exploration project about the Red Planet, its robotic explorers, and the water-ice dome inside Korolev Crater. It combines an illustrated Mars information page, an interactive terrain and rover simulator, and a five-level sample-retrieval game.

**Explore online:** [Mars Exploration Information](https://clover.bhupesh.com.np/index.html) · [Rover Simulator in Korolov](https://clover.bhupesh.com.np/main.html) · [Mission Game](https://clover.bhupesh.com.np/game/game.html)

## Why Mars?

Mars preserves an unusually legible record of planetary change. Ancient river channels, lake deposits, minerals altered by water, and polar ice give orbiters and rovers a way to investigate how a once-wetter world became cold and arid. That record also makes Mars a compelling place to search for past habitable environments.

It is also a practical proving ground for planetary exploration: a day is close to Earth's, the surface is accessible to robotic vehicles, and local resources could one day support longer missions. Its thin carbon-dioxide atmosphere, radiation environment, dust, cold, and distance from Earth make that prospect a substantial engineering challenge—not an easy destination.

### Mars at a glance

- **Mass:** approximately `6.42 × 10²³ kg`. Mass is an intrinsic property; weight depends on the gravitational field.
- **Surface gravity:** approximately `3.72 m/s²`, or about **38% of Earth's**.
- **Mean radius:** approximately `3,390 km`.
- **Day (sol):** approximately `24.6 hours`.
- **Year:** approximately `687 Earth days` (about `668.6 sols`).
- **Atmosphere:** thin and predominantly carbon dioxide.
- **Moons:** Phobos and Deimos.

The information page includes an interactive weight calculator. It scales the entered Earth weight by `0.38` and rounds the result to one decimal place. For a physical force calculation, use `weight = mass × gravity`; for example, a 62 kg person would weigh about `231 N` on Mars (`62 × 3.72`), compared with about `608 N` at Earth's standard gravity. The calculator's kilogram/pound display is a proportional scale-weight equivalent, not a conversion of mass into newtons.

## Why Korolev Crater?

Korolev is a roughly 81 km-wide impact crater in Mars's northern lowlands, near the north polar region. It is named for Soviet rocket engineer Sergei Korolev. Its most striking feature is a central deposit of water ice, around 1.8 km thick at its greatest depth, that persists year-round.

The crater's steep rim helps trap a cold layer of air over the ice. This **cold-trap effect** limits sublimation and helps preserve the deposit. Korolev is therefore valuable both as a natural laboratory for polar climate and ice stratigraphy and as a case study in how accessible water might support future exploration. Extracting and using that ice would require infrastructure and careful resource management; the project presents it as a possibility, not as an operational capability.

The information page lists an estimated ice volume of roughly `2,200 km³`. Its research panel also cites a more conservative estimate of about `1,580 km³`; these are presented as different estimates rather than a single definitive measurement.

**Research reference:** T. C. Brothers and J. W. Holt, “SHARAD sounding of Korolev crater on Mars,” *44th Lunar and Planetary Science Conference* (2013), Abstract 3022. The site's research panel summarizes the radar interpretation as showing reflectors extending to about 1.8 km depth, layered ice-rich material, and similarities to the North Polar Layered Deposits.

### Mars missions in the information page

The mission timeline follows the shift from reconnaissance to sustained surface science:

- **Mariner 4 (1965):** first successful Mars flyby; returned the first close-up images of the surface.
- **Mariner 9 (1971):** first spacecraft to orbit Mars and map much of the planet after a global dust storm.
- **Viking 1 and 2 (1976):** orbiter-lander missions that returned surface panoramas and conducted soil experiments.
- **Pathfinder and Sojourner (1997):** demonstrated mobile surface exploration with the first Mars rover.
- **Spirit and Opportunity (2004):** investigated rocks and evidence of ancient water.
- **Curiosity (2012) and Perseverance (2021):** mobile laboratories studying habitability, geology, and samples; Perseverance also deployed the Ingenuity helicopter.
- **International orbiters and landers:** including Mars Express, India's Mangalyaan, the UAE's Hope, and China's Tianwen-1 and Zhurong.

### NASA data used by the information page

At page load, `tutorial/script.js` calls NASA's public [Images and Video Library search API](https://images-api.nasa.gov/search). It makes one image search each for Curiosity and Perseverance, with the query window set dynamically from the current UTC year minus five years through the current year (`media_type=image`, `page_size=100`). No API key is required.

From those search results, the page:

1. Keeps records whose NASA center is `JPL` and whose title or description mentions Curiosity or Perseverance.
2. Selects the record with the latest `date_created` value. This is the archive record's date, not necessarily the date the rover captured the image.
3. Loads the available image rendition closest to 1,280 pixels wide from NASA's `images-assets.nasa.gov` host.
4. Displays the image title, archive credit (`secondary_creator` or `photographer`), archive date, and a link to the NASA Images record.

The API supplies the archived image and its descriptive metadata; the site does not use it as a live feed and does not request rover telemetry. If the API or image cannot be loaded, the page shows the bundled `tutorial/Mars_360_animation.gif` instead.

The simulator does not load NASA imagery or terrain data: its terrain source is ESA/DLR/FU Berlin HRSC data as credited below. The Brothers & Holt SHARAD findings are summarized from their cited conference abstract; raw SHARAD measurements are not fetched by the site.

## Rover simulator

The simulator renders a route across a cropped Korolev-region terrain map. Use **Orbit**, **Follow**, or **Cockpit** to change the view; select **Photo**, **Elevation**, or **Danger** to change the map layer. Drag to look around, use the route slider to scrub the drive, or press **Play** to follow it. Rover speed, season (`Ls`), and the altitude, slope, and sunlight thresholds are adjustable.

### Displayed telemetry and estimates

| Readout | How it is derived |
| --- | --- |
| Latitude and longitude | Approximate map position, projected around a nominal center near `73° N, 165° E`. |
| Height vs. 3,396 km sphere | Terrain-map elevation relative to the simulator's reference sphere. |
| Height above crater floor | Displayed elevation minus the map's low-elevation reference (`−22,694 m`). |
| Distance from Mars center | `3,396 km + displayed elevation`. |
| Gravity | Mars's point-mass gravitational acceleration with a latitude-dependent rotational correction: `GM/r² − ω²r cos²(latitude)`. |
| Pressure (estimated) | Exponential barometric approximation: `610 Pa × exp(−(elevation + 18,100 m) / 11,100 m)`. |
| Local solar time | The simulator's current clock hour and minute, used as the time input to its solar-position model. |
| Sun elevation and azimuth | Solar declination and hour angle calculated from latitude, time, and the selected solar longitude `Ls`. |
| Sunlight on ground | Seasonal top-of-atmosphere irradiance, surface incidence angle, and a simplified elevation-dependent atmospheric attenuation. It is zero when the Sun is below the horizon. |
| Slope | Local terrain gradient derived from neighboring elevation samples. |
| Pitch / roll | Rover orientation estimated from height differences ahead/behind and across the route. |
| Heading | Direction of the route segment at the rover's current position. |
| Driven / left | Distance traveled and remaining route distance, accumulated along the generated path. |
| Rover speed | User-selected speed; used to advance the route and estimate travel time. |

These are **map-based visualization estimates**, not navigation-grade ephemerides or environmental measurements. Map coordinates and scale are approximate; pressure uses a simplified atmospheric model, and solar exposure omits detailed weather and terrain-shadow modeling.

### Route planning and danger overlays

The planner searches an eight-neighbor grid over the elevation map using A*. A candidate step is rejected when its terrain slope exceeds the selected slope limit. Remaining steps are assigned a cost that increases with slope; steps above the altitude threshold receive an additional fivefold cost. The route is smoothed for display. Route length is the accumulated distance along that path, estimated travel time is `distance ÷ selected speed`, and the reported high-altitude percentage counts sampled path points above the altitude threshold.

The **Danger** layer and HUD warnings apply these tests at the rover's current location:

- **High altitude:** map elevation is greater than the selected altitude limit. The initial limit is based on the 92nd percentile of sampled terrain elevations.
- **Steep slope:** calculated local slope is greater than the selected slope limit (default `10°`).
- **Strong solar exposure:** modeled ground irradiance is greater than the selected sunlight limit (default `120 W/m²`).
- **Darkness / extreme cold warning:** solar elevation is at or below the horizon.

These flags are threshold-based cautions, not predictions of rover failure or a complete hazard model. The route optimizer uses slope and altitude costs; solar exposure and darkness are shown as overlays and warnings, but are not route-cost inputs.

**Terrain and imagery source:** ESA/DLR/FU Berlin, HRSC on Mars Express, **CC BY-SA 3.0 IGO**. The map is cropped and combined by the project under the same license. Terrain heights are interpreted from the map's color legend; location and scale are approximate.

## Mission game

The game is a stylized, one-person surface expedition. Each level asks you to provision the habitat, locate ice, soil, and rock sites, collect the required samples, and return them to the launch vehicle. Five levels progressively increase sample quotas, route spread, and mission duration.

1. Collect water, food, fuel, and sample pouches from the base stores.
2. Board the rover and use the scanner to locate nearby sample sites.
3. Leave the rover to collect each required sample; remain still while sampling.
4. Return to the launch pad, park beside the rocket, and launch the sample payload.
5. Rendezvous with the **Sun–Mars L1 relay**, transfer the canisters, and return to Mars to complete the mission.

The L1 relay and flight are narrative gameplay elements: the flight is compressed and the scene is not a scale model or a validated interplanetary trajectory.

### Supplies and life support

The habitat panel demonstrates a periodic production cycle: every simulated 20 seconds the solar array adds `8 kWh`; when at least `6 kWh` is available, the system spends it to generate `1` unit each of oxygen, water, and food. The panel tracks those produced stores separately from the mission's consumable meters. During the surface drive, mission water, food, and oxygen are finite supplies and deplete over time.

Fuel is collected from base storage. Rover movement consumes fuel, and the rocket needs a level-specific reserve for its outbound and return legs. **Solar panels produce electrical power in this game; they do not manufacture rocket propellant.**

### Controls

| Input | Action |
| --- | --- |
| `WASD` or arrow keys | Drive the rover or walk on foot |
| `Shift` | Boost movement |
| `Space` | Jump on foot |
| `E` | Collect a sample while on foot and stationary |
| `Q` | Scan for sample sites (scanner has a recharge interval) |
| `F` | Board or exit the rover |
| `C` | Launch from the pad after meeting mission requirements |
| Drag | Look around |

Touch-friendly on-screen controls are available on small or touch-screen displays. Progress through completed levels is saved in browser local storage.

## Run locally

This is a static website: there is no package installation or build step.

1. Download and extract the repository, or clone it:

   ```bash
   git clone https://github.com/itsbhupesh00/clover.git
   cd clover
   ```

2. Start a local web server from the project directory:

   ```bash
   python -m http.server 8000
   ```

   On Windows, `py -m http.server 8000` can be used if the `py` launcher is installed.

3. Open these pages in a browser:

   - Information: `http://localhost:8000/` or `http://localhost:8000/index.html`
   - Simulator: `http://localhost:8000/main.html`
   - Game: `http://localhost:8000/game/game.html`

The information page and simulator load some libraries and fonts from CDNs, so an internet connection is needed for all page resources to appear. The game bundles Three.js locally. No account or API key is required.

### Download without Git

On GitHub, choose **Code → Download ZIP**, extract the archive, then start the local server from the extracted project folder as above. Keeping the folder structure intact is necessary because the pages load their stylesheets, scripts, and images by relative path.

## Project layout

```text
index.html             Mars information, mission timeline, and Korolev Crater
main.html              Korolev rover-drive simulator
script.js              Simulator rendering, route planning, and telemetry
game/game.html         Sample-retrieval game
game/script.js         Game missions, controls, and life-support logic
game/3js.js            Bundled Three.js r128 library
tutorial/              Information-page styles, scripts, and images
style.css              Simulator styles
game/style.css         Game styles
```

## Credits

- Korolev-region imagery and topography: **ESA/DLR/FU Berlin (HRSC, Mars Express), CC BY-SA 3.0 IGO**; cropped and combined by the project under the same license.
- Information-page hero: the latest available Curiosity or Perseverance image found through NASA's public Images and Video Library API. It is an archive image, not a live stream; a local Mars animation is used if the API is unavailable.
- Bundled Three.js r128: **MIT License**, copyright Three.js Authors.
- The information page's research summary cites **Brothers & Holt, 44th Lunar and Planetary Science Conference (2013), Abstract 3022**.



<!-- 
use of SI tool is done for certain things like: 
1. conversion of geotiff format to 3js assets
2. 3js assets generation for game

Game logic is purely genuine. 
-->