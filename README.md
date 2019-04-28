## Electrified Wiki (EXPERIMENTAL)

This is a wrapper around fedwiki. It both runs a local server and allows you to
browse other servers using a built-in instance of wiki-client.

It is in no way ready for someone to use as a day to day wiki viewer / editor.

If this experiment is successful, it will provide an easy way for someone to get
started running their own fed wiki locally.

The tool currently supports friends security as well as passportjs.

## Installation

There is no bundled install yet. Download the source and run:

```
npm install
npm start
```

## Features

- Open a wiki with CmdOrCtrl+O.
- Close an open wiki with CmdOrCtrl+W (except for the last open wiki).
- Window title changes to the origin of the currently viewed wiki.

## Key Gaps / Blockers

- Not possible to drag wiki pages between wikis.
- Not possible to reorder open wiki.
- Internal authentication to the bundled wiki server immediately expires.

## Config Options

Most of the non-farm and non-cluster related options of [wiki-client](https://github.com/fedwiki/wiki-client) are supported.

Start electrified with friends security for the local wiki. Preregister wiki bar entries for the local wiki and fed.wiki.org.
```
npm start -- --security_type friends --wikis http://localhost:31357,https://fed.wiki.org
```

## Development Notes

The development journal and design notes are at [fed.wiki.randombits.xyz](https://fed.wiki.randombits.xyz/electrified-wiki.html).

## Open Issues

Issues are tracked within [the project](https://github.com/joshuabenuck/wiki-electrified/issues).

