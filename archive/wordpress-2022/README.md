# die Gemeinde in Frankfurt

Website for gemeindeinfrankfurt.de.

## Status

The live WordPress site went offline around 2026-10-21, when the old BizLand hosting stopped serving the domain. The domain is registered in Route 53 (AWS account 059926209287), with DNS in hosted zone `Z060045521UKJ3WLLVB9D`. That zone has no website record yet.

## What is here

- `content/de`, `content/en`: the wording of each page, recovered from the Internet Archive. The front matter links to the snapshot each file came from.
- `wayback/`: raw files from the latest Internet Archive snapshot of each URL (HTML, theme CSS and JS, header image). `wayback-index.txt` lists the snapshot timestamp of each file.
- `screenshots/`: the old design, captured from the archived pages.

The files under `wayback/index.php/welcome/` are from an earlier site for OptixCom (Optix Communications), not the church.

## The old site

- WordPress 4.7.22 multisite: German at `/`, English at `/en/`, linked with the Multisite Language Switcher plugin.
- Theme: bluegray. Contact form: Pirate Forms (with reCAPTCHA).
- Pages: Über uns / About us, Für Besucher / For Visitors, Unser Glaube / Our Belief.
- Meeting place: Ginnheimer Stadtweg 120, 60431 Frankfurt am Main (Google Maps embed).
- Header photo: `wayback/wp-content/uploads/2017/02/cropped-P7081950-edited.jpg`.
