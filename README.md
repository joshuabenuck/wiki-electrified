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

## Config Options

Most of the non-farm and non-cluster related options of [wiki-client](https://github.com/fedwiki/wiki-client) are supported.

Start electrified with friends security for the local wiki. Preregister wiki bar entries for the local wiki and fed.wiki.org.
```
npm start -- --security_type friends --wikis http://localhost:31357,https://fed.wiki.org
```

## Development Notes

The development journal and design notes are at [fed.wiki.randombits.xyz](https://fed.wiki.randombits.xyz/electrified-wiki.html).

## TODOs

There's a lot missing from this tool. Here's a list of the top of mind items.

- [x] Support for logging into a wiki.
- [x] Ability to open arbitrary fedwiki sites.
- [x] Support for running internal wiki server in non-read-only mode.
- [x] Prefetch wiki favicons.
- [x] Support for passing in command line args to customize server properties.
- [ ] Ability to suppress startup of internal wiki server instance.
- [ ] Properly update the title to reflect currently displayed wiki.
- [ ] Saving of currently open wikis and their states in localStorage.
- [ ] Caching of fedwiki site favicons across app restarts.
- [ ] Systray integration to support running the app in headless mode.
- [ ] Support for a server-only mode of operation.
- [ ] A splash screen.
- [ ] A welcome page with configuration options.
- [ ] A non-electron application icon.
- [ ] Binary release packages.
- [ ] Auto updating of released packages.

