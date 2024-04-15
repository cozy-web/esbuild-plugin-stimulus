# @cozy-web/esbuild-plugin-stimulus

[esbuild](https://esbuild.github.io/) plugin for automatically loading
[Stimulus](https://stimulus.hotwire.dev/) controllers from a folder.

For example, if you create `controllers/users/list_item_controller.js`,
then your Stimulus controller will be available as `users--list-item`.

## Install

```shell
npm install --save-dev @cozy-web/esbuild-plugin-stimulus
```

## Usage

In your [esbuild script](https://esbuild.github.io/getting-started/#build-scripts):

```javascript
// build.js

const esbuild = require('esbuild')
const pluginStimulus = require('@cozy-web/esbuild-plugin-stimulus')

esbuild
  .build({
    plugins: [pluginStimulus()],
    // ...
  })
  .catch(() => process.exit(1))
```

And in your application (similar to [using webpack](https://stimulus.hotwire.dev/handbook/installing#using-webpack-helpers)):

```javascript
// app.js

import { Application } from '@hotwired/stimulus'
import { definitions } from 'stimulus:./controllers'

const app = Application.start()
app.load(definitions)
```

## Caveats

Due to [the limitations of `watchFiles` and `watchDirs`](https://esbuild.github.io/plugins/#on-resolve-results):

> A rebuild will be triggered if any file in the `watchFiles` array has been changed since the last build. Change detection is somewhat complicated and may check the file contents and/or the file's metadata.
> A rebuild will also be triggered if the list of directory entries for any directory in the `watchDirs` array has been changed since the last build. Note that this does not check anything about the contents of any file in these directories, and it also does not check any subdirectories. Think of this as checking the output of the Unix `ls` command.

This plugin can't detect the changes in newly created directories when using watch mode. You have to restart ebuild to make it aware of the changes.

## License

Apache License 2.0
