import * as path from 'path'
import { readdir } from 'fs'
import { promisify } from 'util'
import glob from 'glob'

const CONTROLLER_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']

const CONTROLLER_SUFFIXES = ['-controller', '_controller']

function parseControllerName(filename) {
  let base
  for (let ext of CONTROLLER_EXTENSIONS) {
    if (filename.endsWith(ext)) {
      base = filename.substring(0, filename.length - ext.length)
      break
    }
  }
  if (base === undefined) {
    return null
  }
  for (let suffix of CONTROLLER_SUFFIXES) {
    if (base.endsWith(suffix)) {
      return {
        controller: base.substring(0, base.length - suffix.length).replace(/_/g, '-'),
        module: base,
      }
    }
  }
  return null
}

export const stimulusPlugin = () => ({
  name: 'stimulus',
  setup(build) {
    const namespace = 'stimulus_ns'

    build.onResolve({ filter: /^stimulus:./ }, (args) => {
      const pathArg = args.path.substring('stimulus:'.length)
      const controllerDir = path.join(args.resolveDir, pathArg.replace(/\//g, path.sep))
      const watchDirs = [controllerDir, ...glob.sync(path.join(controllerDir, '**/*/'))]
      const watchFiles = glob.sync(path.join(controllerDir, '**/*'), { nodir: true })
      return {
        path: controllerDir,
        watchDirs: watchDirs,
        watchFiles: watchFiles,
        namespace,
      }
    })

    build.onLoad({ filter: /.*/, namespace }, async (args) => {
      const walk = async (dir, prefix, moduleDir) => {
        let files
        try {
          files = await promisify(readdir)(dir, { withFileTypes: true })
        } catch {
          // Does not exist. Return empty list.
          return []
        }
        let result = []
        for (const ent of files) {
          if (ent.isDirectory()) {
            result.push(
              ...(await walk(
                path.join(dir, ent.name),
                prefix + ent.name.replace(/_/g, '-') + '--',
                moduleDir + '/' + ent.name
              ))
            )
            continue
          }
          const parseResult = parseControllerName(ent.name)
          if (parseResult) {
            result.push({
              controllerName: prefix + parseResult.controller,
              modulePath: moduleDir + '/' + parseResult.module,
            })
          }
        }
        return result
      }
      const controllers = await walk(args.path, '', '.')
      let contents = ''
      for (let i = 0; i < controllers.length; i++) {
        const { modulePath } = controllers[i]
        contents += `import c${i} from '${modulePath}';\n`
      }
      contents += 'export const definitions = [\n'
      for (let i = 0; i < controllers.length; i++) {
        const { controllerName } = controllers[i]
        contents += `\t{identifier: '${controllerName}', controllerConstructor: c${i}},\n`
      }
      contents += '];\n'
      return {
        contents,
        loader: 'js',
        resolveDir: args.path,
      }
    })
  },
})
