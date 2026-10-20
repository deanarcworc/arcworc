# ARCWORC

Interactive static agency website hosted on the existing Cloudflare Pages project. The enquiry Worker is deployed separately; see server/README.md.

Run `npm run build` after editing source/shell.html or page content to regenerate 23 crawlable HTML pages, canonical tags, social metadata, structured data and the sitemap. The same content.js renders the interactive views and static pages. `npm test` validates routes, content, enquiry handling and motion. Commit both the authored source and generated dist files.

Cloudflare Pages uses cloudflare-production, a blank build command and dist as output. Deployments currently use Direct Upload; native Git deployment remains unconnected. Preserve the existing project and enquiry Worker.

Internal navigation uses browser history and clean URLs; old hash URLs remain supported. Shared scripts and the authored shell must use the same release query identifier. Versioned font/map assets have long-lived browser caching; use a new filename if replacing their contents. The original full fonts and map remain available in assets.

scripts/social-image.py rebuilds the social preview from the authentic wordmark SVG. Python dependencies: Pillow and fontTools. The social PNG is already committed, so this is not required for ordinary builds.
