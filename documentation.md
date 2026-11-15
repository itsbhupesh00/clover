# NASA Space Apps Project Submission

## Project Name

**Project Clover: Exploring Mars and Korolev Crater**

## High-Level Project Summary

Project Clover is a browser-based Mars exploration project with an interactive information page, a Korolev Crater rover simulator, and a five-level surface mission game. Visitors can explore Mars science, compare terrain data, plan a rover traverse, and manage supplies while collecting samples.

The project makes planetary science and mission trade-offs tangible by connecting scientific context with interactive terrain, estimated environmental telemetry, and a resource-constrained mission. Korolev Crater's persistent ice provides a focused case study in why local resources may matter to future exploration.

## Link to Final Project

- **Live project:** [https://clover.bhupesh.com.np/index.html](https://clover.bhupesh.com.np/index.html)
- **Source repository:** [https://github.com/itsbhupesh00/clover](https://github.com/itsbhupesh00/clover)
- **Rover simulator:** [https://clover.bhupesh.com.np/main.html](https://clover.bhupesh.com.np/main.html)
- **Mission game:** [https://clover.bhupesh.com.np/game/game.html](https://clover.bhupesh.com.np/game/game.html)

## Detailed Project Description

### What it does

- **Mars information page:** introduces Mars's gravity, day and year, moons, exploration history, and Korolev Crater. An interactive calculator estimates a user's Mars scale-weight equivalent from an Earth weight.
- **Korolev rover simulator:** renders a route over cropped ESA HRSC terrain, provides NASA MOLA elevation as a comparison layer, and offers orbit, follow, and cockpit views; photo, elevation, and danger layers; a route-progress control; and adjustable rover speed, season, altitude, slope, and solar-exposure thresholds.
- **Surface mission game:** guides the player through five increasingly demanding levels. The player gathers supplies at a base, scans for ice/soil/rock sites, collects the required samples on foot, returns to the launch pad, and transfers the sample payload through a stylized Sun–Mars L1 relay sequence.

### How it works

The information page is a static HTML/CSS/JavaScript site. The simulator uses Three.js to render the rover on project-prepared ESA HRSC terrain and A* search to plan a route. NASA MOLA data appears as a separate, coarse elevation layer; the HUD reports its interpolated value and difference from the HRSC-derived height. Route planning and danger overlays use HRSC terrain, not MOLA. The game combines Three.js, procedural terrain, keyboard and touch controls, mission quotas, and simplified resource counters. Its habitat production panel is a separate demonstration: generated stores do not replenish finite mission supplies, a distinction also shown in the HUD.

The simulator's coordinates, terrain scale, pressure, gravity, solar exposure, and route results are educational approximations—not operational navigation or weather forecasts. The game is a narrative simulation, not a validated human-spaceflight or interplanetary mission design.

### Benefits and goals

Project Clover aims to:

- make planetary facts and scientific data more engaging through direct interaction;
- connect remote-sensing and terrain interpretation with surface mobility decisions;
- explain why polar water ice is of interest without implying that extraction is already practical; and
- encourage learners to explore mission constraints such as terrain, supplies, time, and sample return.

### Tools and technologies

- HTML, CSS, and JavaScript
- Three.js r128 for 3D rendering
- NASA Images and Video Library search API for archived rover imagery
- NASA MGS MOLA MEGDR planetary-radius raster and a Python standard-library crop utility
- Bootstrap 5.3.3 and Bootstrap Icons 1.11.3 for information-page layout and icons
- Google Fonts (Inter, Space Grotesk, and Sora)
- Browser local storage for game level progress
- No physical hardware, account, API key, or build step is required

## NASA Data

### NASA Images and Video Library

The information page uses NASA's public [Images and Video Library search API](https://images-api.nasa.gov/search) to retrieve archived Curiosity and Perseverance images when the page loads.

- **Endpoint:** `https://images-api.nasa.gov/search`
- **Queries:** one search for `Curiosity Mars rover` and one for `Perseverance Mars rover`
- **Filters:** `media_type=image`; each query covers the current UTC year and the previous five years, with up to 100 results
- **Selection:** the page keeps results whose `center` is `JPL` and whose title or description mentions Curiosity or Perseverance, then selects the result with the latest `date_created`
- **Image and metadata used:** an available NASA image rendition closest to 1,280 pixels wide, plus the record title, `date_created`, `secondary_creator` or `photographer`, and `nasa_id`
- **Display and attribution:** the page shows the title, archive credit, archive-record date, and a link to the record on NASA Images. The image is served from NASA's `images-assets.nasa.gov` domain.
- **Authentication:** no API key is required.

`date_created` is the NASA archive record's date; it is not guaranteed to be the date the rover acquired the image. This is the latest matching item found in the searched archive results, not a live transmission, live camera, or rover telemetry feed. If the API or image cannot be loaded, the page falls back to `tutorial/Mars_360_animation.gif`.

### Korolev Crater research reference

The information page also summarizes findings attributed to T. C. Brothers and J. W. Holt, *44th Lunar and Planetary Science Conference* (2013), Abstract 3022. The research summary discusses SHARAD radar observations from NASA's Mars Reconnaissance Orbiter. The project cites the study as scientific context; it does **not** download or process raw SHARAD measurements.

### NASA MOLA elevation data used by the simulator

The simulator reads a small crop from the NASA Planetary Data System's MGS MOLA Mission Experiment Gridded Data Record:

- **Product/file:** `MEGR90N000FB.IMG`, planetary-radius product, dataset `MGS-M-MOLA-5-MEGDR-L3-V1.0`
- **Citation:** Smith, D. E., M. T. Zuber, G. A. Neumann, E. A. Guinness, and S. Slavney, *Mars Global Surveyor Laser Altimeter Mission Experiment Gridded Data Record*, MGS-M-MOLA-5-MEGDR-L3-V1.0, NASA PDS (2003), [DOI 10.17189/1519460](https://doi.org/10.17189/1519460)
- **Grid:** 32 samples per degree, approximately 1.85 km per pixel at the equator; the source raster is a simple cylindrical grid with 5,760 rows and 11,520 columns. Pixel values are signed 16-bit, most-significant-byte first, in meters relative to a 3,396,000 m reference radius.
- **Subset:** zero-based rows 512–576 and columns 5,151–5,407 inclusive (65 × 257 cells). The checked-in JSON stores only the numeric crop and provenance fields, not the global raster.
- **Processing:** [`tools/build_mola_crop.py`](tools/build_mola_crop.py) requests the contiguous source rows using an HTTP byte range, decodes the big-endian signed integers, and writes [`data/mola-korolev-32ppd.json`](data/mola-korolev-32ppd.json). No third-party Python packages are needed.
- **Application:** `script.js` converts approximate rover map coordinates to MOLA pixel coordinates, performs bilinear interpolation, renders the MOLA layer with a crop-minimum-to-maximum color stretch, and reports MOLA height and HRSC-minus-MOLA difference in telemetry.
- **Limitations:** MOLA is substantially coarser than the HRSC visualization. Its values do not drive the rover route, terrain mesh, or danger calculations; these remain based on HRSC map values and simplified project models. The comparison is educational, not a validation of navigation-grade elevation.

The page also uses the NASA Images and Video Library API for archived rover imagery as described above. NASA imagery is not used as simulator terrain, and the SHARAD conference findings are cited as research context rather than processed raw radar data.

## Space Agency Partner Data and Other References

### Space agency data and scientific references

- **European Space Agency (ESA) partner data:** HRSC imagery and topography from ESA/DLR/FU Berlin's Mars Express instrument. The map is cropped and combined by the project under the original **CC BY-SA 3.0 IGO** license. Terrain heights are interpreted from the map's color legend; coordinates and scale are approximate.
- **NASA planetary data:** MGS MOLA MEGDR planetary-radius raster `MEGR90N000FB.IMG`, extracted crop and PDS citation described above.
- **NASA:** Curiosity and Perseverance image records retrieved from the [NASA Images and Video Library API](https://images-api.nasa.gov/search), as described above.
- **NASA mission science reference:** Brothers & Holt, *44th Lunar and Planetary Science Conference* (2013), Abstract 3022, cited for the Korolev/SHARAD research summary.
- Other mission-history and planetary-fact text is educational context in the project; the live simulator does not query NASA for those values.

### Software, libraries, and media

- **Three.js r128:** MIT License. The game uses the bundled `game/3js.js`; the simulator loads Three.js from cdnjs.
- **Bootstrap 5.3.3** and **Bootstrap Icons 1.11.3:** loaded from jsDelivr.
- **Google Fonts:** Inter, Space Grotesk, and Sora.
- **Decorative video:** the information page references an Otter/Skateboard animation hosted by SVGApp: `https://svgapp.ai/_astro/otter-skateboard-transparent.D9ELGXsj.webm`.
- **Local visual assets:** `tutorial/Mars_360_animation.gif` is the fallback hero animation; `tutorial/plan_view.png` is used in the crater information page. Keep the source and reuse terms with the project; confirm them if these assets are not original or covered by the HRSC attribution above.
- **Project code and 3D scenes:** HTML, CSS, and JavaScript in this repository; game scenery and mission mechanics are rendered in the browser.

The information page and simulator use external CDNs for some fonts and libraries, so those resources require an internet connection. NASA archive requests also require connectivity; the local Mars animation remains available as the hero fallback.
