## Electrified Wiki (EXPERIMENTAL)

This is a wrapper around fedwiki. It both runs a local server and allows you to
browse other servers using a built-in instance of wiki-client.

It is in no way ready for someone to use as a day to day wiki viewer / editor.

If this experiment is successful, it will provide an easy way for someone to get
started running their own fed wiki locally.

## Installation

There is no bundled install yet. Download the sourcxe and run:

```
npm install
npm start
```

## TODOs

There's a lot missing from this tool. Here's a list of the top of mind items.

- [ ] Saving of currently open wikis and their states in localStorage.
- [ ] Caching of fedwiki site favicons across app restarts.
- [ ] Ability to open arbitrary fedwiki sites.
- [ ] Running internal wiki server in non-read-only mode.
- [ ] Support for logging into a wiki.
- [ ] Properly update the title to reflect currently displayed wiki.
- [ ] Ability to suppress startup of internal wiki server instance.
- [ ] Support for passing in command line args to customize server properties.
- [ ] Systray integration to support running the app in headless mode.
- [ ] Support for a server-only mode of operation.
- [ ] A splash screen.
- [ ] A welcome page with configuration options.
- [ ] A non-electron application icon.
- [ ] Binary release packages.
- [ ] Auto updating of released packages.

