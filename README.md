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
const pluginStimulus = require('esbuild-plugin-stimulus')

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

## License

Apache License 2.0
