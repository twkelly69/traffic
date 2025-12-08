# Traffic Accident Visualization

This project visualizes traffic accidents in Taipei, Taiwan using D3, DC.js, Crossfilter, and the Google Maps JavaScript API. The visualization is fully client-side and reads data from `accidentXY.tsv`/`accidentXY_light.tsv`.

## Files
- `index.html` – page markup and third-party includes.
- `css/traffic.css` – styling for the map, navigation, and filter controls.
- `js/traffic.js` – client-side logic for maps, charts, and navigation text.
- `accidentXY.tsv` and `accidentXY_light.tsv` – tabular datasets consumed by the page; `accidentXY_light.tsv` is now generated from the 2024 (113年) Taipei A1/A2 crash records.

## Running locally
No build step is required. Serve the repository root as static files and open `index.html` in a browser:

```sh
python -m http.server 8000
# then browse to http://localhost:8000/
```

The page loads data directly from the TSV files and requires internet access for external libraries and Google Maps.

## Deploying to GitHub Pages
The site is ready to publish from the repository root on the `main` branch.

1. Ensure GitHub Pages is enabled with source set to “Deploy from a branch” and folder `/` on `main`.
2. Push to `main`; the included workflow (`.github/workflows/pages.yml`) uploads the root directory and publishes it to the GitHub Pages environment.
3. Access the site at `https://<your-user>.github.io/traffic/` (replace `traffic` if the repository name differs).

## Development workflow
LiveScript, Stylus, and Jade sources have been removed. Make changes directly in the formatted HTML, JS, and CSS files listed above. There is no longer a Gulp pipeline; if you prefer automation (for example, formatting), add npm scripts instead of reintroducing the old Gulp tasks.
