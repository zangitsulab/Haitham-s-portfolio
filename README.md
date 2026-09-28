# Haitham — Medical Portfolio

This version is intentionally simplified.

## Public side
Visitors see one clean website with:
- Home
- Articles
- Projects
- About
- Contact

There are no article categories, tags, resources, or other heavy CMS sections.

## Owner side
The owner uses the **same website**. Add `?owner=1` to the website URL to open the owner sign-in, then the dashboard lets you:
- add/edit/delete articles
- add/edit/delete projects
- publish content that immediately appears on the public side of this browser

The public navigation does not show an admin button.

### Prototype login
The current static prototype uses a client-side demo password stored in `app.js` as `OWNER_PASSWORD`. Change it before testing if desired.

**Important:** this is not real security. Because this is a static front-end prototype, the password can be inspected by someone with the source code. Before real public deployment, replace this with server-side authentication and a database/storage service (for example Supabase Auth + Database + Storage). The public/admin experience can remain the same.

## Content
All placeholder articles from the previous prototype have been removed. The new article and project lists start empty.
