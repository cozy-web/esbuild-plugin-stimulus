import * as esbuild from 'esbuild'
import { execFile } from 'child_process'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import * as process from 'process'
import plugin from '.'

let workDir

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esbuild-plugin-stimulus-test-'))
})

afterEach(async () => {
  if (workDir) {
    await fs.rm(workDir, { recursive: true })
    workDir = 'bork'
  }
})

const listDefinitions = async (files) => {
  const entrypointPath = path.join(workDir, 'in.js')
  await fs.writeFile(
    entrypointPath,
    `
    import { stdout } from 'process';
    const definitions = require('stimulus:.').definitions.map(({ identifier, controllerConstructor: ctor }) => ({identifier, className: ctor.name}));
    stdout.write(JSON.stringify(definitions));
    `
  )
  for (const fname in files) {
    if (files.hasOwnProperty(fname)) {
      const fullPath = path.join(workDir, fname.replace(/\//g, path.sep))
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, files[fname])
    }
  }

  const outputFile = path.join(workDir, 'out.js')
  await esbuild.build({
    entryPoints: [entrypointPath],
    outfile: outputFile,
    bundle: true,
    platform: 'node',
    target: 'node14',
    plugins: [plugin()],
  })

  return runScript(outputFile)
}

const runScript = async (filename) => {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, ['--', filename], (error, stdout, _stderr) => {
      if (error) {
        reject(error)
        return
      }
      resolve(JSON.parse(stdout))
    })
  })
}

test('basic controller', async () => {
  const got = await listDefinitions({
    'foo_controller.js': 'export default class Foo {}',
  })
  expect(got).toEqual([{ identifier: 'foo', className: 'Foo' }])
})

test('underscores', async () => {
  const got = await listDefinitions({
    'foo_bar_controller.js': 'export default class FooBar {}',
  })
  expect(got).toEqual([{ identifier: 'foo-bar', className: 'FooBar' }])
})

test('hyphens', async () => {
  const got = await listDefinitions({
    'foo-bar-controller.js': 'export default class FooBar {}',
  })
  expect(got).toEqual([{ identifier: 'foo-bar', className: 'FooBar' }])
})

test('TypeScript', async () => {
  const got = await listDefinitions({
    'foo_controller.ts': 'export default class Foo {}',
  })
  expect(got).toEqual([{ identifier: 'foo', className: 'Foo' }])
})

test('jsx', async () => {
  const got = await listDefinitions({
    'foo_controller.jsx': 'export default class Foo {}',
  })
  expect(got).toEqual([{ identifier: 'foo', className: 'Foo' }])
})

test('tsx', async () => {
  const got = await listDefinitions({
    'foo_controller.tsx': 'export default class Foo {}',
  })
  expect(got).toEqual([{ identifier: 'foo', className: 'Foo' }])
})

describe('directories', () => {
  test('separate with two hyphens', async () => {
    const got = await listDefinitions({
      'foo/bar_controller.js': 'export default class FooBar {}',
    })
    expect(got).toEqual([{ identifier: 'foo--bar', className: 'FooBar' }])
  })

  test('are walked recursively', async () => {
    const got = await listDefinitions({
      'foo/bar/baz_controller.js': 'export default class FooBarBaz {}',
    })
    expect(got).toEqual([{ identifier: 'foo--bar--baz', className: 'FooBarBaz' }])
  })

  test('pass through hyphens', async () => {
    const got = await listDefinitions({
      'foo-bar/baz_controller.js': 'export default class FooBarBaz {}',
    })
    expect(got).toEqual([{ identifier: 'foo-bar--baz', className: 'FooBarBaz' }])
  })

  test('convert underscores to hyphens', async () => {
    const got = await listDefinitions({
      'foo_bar/baz_controller.js': 'export default class FooBarBaz {}',
    })
    expect(got).toEqual([{ identifier: 'foo-bar--baz', className: 'FooBarBaz' }])
  })
})
