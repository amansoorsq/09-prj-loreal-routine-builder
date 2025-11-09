# L'Oréal Routine Builder

What this is

- A lightweight front-end demo that lets users browse L'Oréal family products, select items, and generate a personalized AM/PM routine using a chat-style assistant.
- Includes a minimal Cloudflare Worker example that proxies requests to the OpenAI chat API.

Highlights

- Category filter and responsive product grid with expandable descriptions.
- Click-to-select products; selections persist via localStorage.
- "Generate Routine" sends structured product JSON to a worker which forwards it to the OpenAI chat endpoint; responses appear in the chat window.
- Follow-up questions are supported using the saved conversation history.

Tech stack

- Plain HTML, CSS, and vanilla JavaScript (no bundlers or npm).
- Cloudflare Worker (example proxy: RESOURCE_cloudflare-worker.js).
- Uses fetch() and async/await for network calls.

How to run

1. Serve this folder with a static server (Live Server in VS Code or any static host).
2. Deploy the worker using the provided worker example and set the `OPENAI_API_KEY` secret in Cloudflare.
3. Update `WORKER_URL` in `script.js` or add a `secrets.js` that exposes the worker URL to the frontend.
4. Open `index.html` and try filtering, selecting products, and generating a routine.

Files to inspect

- `script.js` — product selection, persistence, message construction, and chat UI.
- `style.css` — responsive grid and visual design.
- `RESOURCE_cloudflare-worker.js` — minimal worker proxy to OpenAI.
- `products.json` — sample product data.

Notes

- The project is intended as a simple, self-contained demo to explore front-end UX patterns and basic API integration.
