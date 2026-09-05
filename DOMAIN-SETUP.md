# TALKSWAHILI domain setup

Primary SEO URL: `https://talkswahililive.site/`

Set `talkswahililive.site` as the **Primary Domain** in Vercel. If `www.talkswahililive.site` is also connected, let the hosting platform redirect it in one direction to the primary domain.

Do not add a `www` ↔ apex redirect inside the application. This project intentionally has no `vercel.json` redirect rule, which prevents an application/hosting redirect loop.

After deployment, confirm:

- `https://talkswahililive.site/` loads normally.
- `https://www.talkswahililive.site/` either loads normally or redirects once to the primary domain.
- `https://talkswahililive.site/robots.txt` is reachable.
- `https://talkswahililive.site/sitemap.xml` is reachable.

For Google indexing, add the primary URL to Google Search Console and submit the sitemap. Ranking position cannot be guaranteed by code alone; Google also evaluates crawlability, content, links, reputation and user signals over time.
