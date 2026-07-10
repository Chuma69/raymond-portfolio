# Sanity Studio — content for the portfolio

This folder **is** the Sanity Studio: the app where you edit the site's
**Projects** (home cards, the full Projects page, and each case-study page),
**Currently reading** (books), and **Writing** (home articles + their
raymond.wtf links and dates).

It's already wired to your Sanity project (`s2eac3u5`, dataset `production`) and
the schemas in `schemaTypes/`.

## Run it

```bash
cd sanity
npm install
npm run dev
```

Open http://localhost:3333 and log in with the Sanity account that owns the
project. Add your content and hit **Publish** — it appears on the site with no
redeploy (the site reads published content directly from Sanity).

## Optional: host the Studio

```bash
npm run deploy
```

This publishes the Studio to `https://<name>.sanity.studio` so you can edit
content from anywhere without running it locally.

## Content types

- **Project** — title, slug, role, year, summary, live URL (optional), order,
  a short case-study description, and an optional case-study body (headings,
  bullet/numbered lists, quotes, images, links). The first three by `order`
  show on the home page; all show on `/projects`. The slug is the URL, e.g.
  `/projects/the-garage`. If a project has no live URL, its case-study page
  links to your other projects and your blog instead.
- **Currently reading** — title, author, category, order.
- **Writing** — title, the raymond.wtf link, and the date.

## Connecting the website

The site (`../public/index.html`) already has your project ID in its `SANITY`
config. It reads the public `production` dataset in the browser — no token
needed. Make sure your site origins are allowed in Sanity → API → CORS origins
(`http://localhost:4300` and your production domain), credentials unchecked.
