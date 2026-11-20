# Rspack RSC: a client component reached only through a client-imported server action is never handed off

Reproduction for (issue link once filed).

Plain Rsbuild + `rsbuild-plugin-rsc`, no framework. A `'use server'` module that only a client component imports
renders another client component. The build passes; calling the action fails because that client component is not in
the client manifest.

```sh
npm install
npm run repro    # nested chain and its plain-client twin: BUG
npm run control  # server renders Inner itself; a second build seeded from the first: OK
npm run watch    # rsbuild build --watch, then two edits: BUG after every compilation
```

```
src/Outer.jsx     'use client'  imports showInner from actions.jsx (its only importer)
src/actions.jsx   'use server'  showInner() returns <Inner />
src/Inner.jsx     'use client'  <p>inner</p>
src/Twin.jsx      'use client'  renders <Inner /> (plain-client twin)
src/pages/*.jsx   the server page (VARIANT): nested = <Outer />; twin = <Outer /><Twin />; early = <Outer /><Inner />
```

`repro.mjs` builds with `rsbuild build`, imports `dist/server/index.js` and calls `showInner` the way a request
handler does (`loadServerAction(id)`, then `renderToReadableStream(result)`). It prints the client references Rspack
passed to `ServerPlugin`'s `onManifest` (written to `dist/manifest.json` by `record.mjs`) and React's error.

The two-pass control is a second complete build in which the server entry also imports the action modules the first
build got back from the client (`builtin:rsc-action-entry-loader?...&from-client=true`, recorded by `record.mjs`), so
the server sees them before its handoff.

Results (Node 26.12.1, Linux x64; @rsbuild/core 2.3.3 / @rspack/core 2.3.3, rsbuild-plugin-rsc 0.1.1,
react-server-dom-rspack 0.1.1, react 19.3.1):

```
$ npm run repro
BUG nested   the action renders Inner, nothing else does
    client manifest: Outer.jsx
    Inner in client JS: no
    showInner(): Could not find the module "<root>/src/Inner.jsx#Inner" in the React Client Manifest. This is probably a bug in the React Server Components bundler.
BUG twin     a client component also renders Inner
    client manifest: Outer.jsx, Twin.jsx
    Inner in client JS: yes
    showInner(): Could not find the module "<root>/src/Inner.jsx#Inner" in the React Client Manifest. This is probably a bug in the React Server Components bundler.

$ npm run control
OK  early    the server also renders Inner itself
    client manifest: Inner.jsx, Outer.jsx
    Inner in client JS: yes
OK  nested   second build, seeded from the first
    client manifest: Inner.jsx, Outer.jsx
    Inner in client JS: yes

$ npm run watch
BUG first build   client manifest: Outer.jsx
BUG after edit 1  client manifest: Outer.jsx
BUG after edit 2  client manifest: Outer.jsx
```

Same rows on @rspack/core 2.3.1 (@rsbuild/core 2.3.1) and 2.2.9 (@rsbuild/core 2.2.14), and with react 19.2.9.
