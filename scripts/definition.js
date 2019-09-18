const fs = require('fs-extra')
const path = require('path')

const dts = require('ts-declarator').default

const log = require('./common')


/**
 * Create TypeScript definition file (.d.ts) for a package.
 */
async function definition(options) {
	log.bold('> definition.js')

	const opts = Object.assign({
		externs: [],
		exclude: [],
		transformFn: (content) => content,
	}, options)
	const CWD = process.cwd()
	const PKG = await fs.readJson(path.join(CWD, 'package.json'))
	const DEF_FILE = path.join(CWD, 'typings', 'app.d.ts')
	const config = {
		name: `${PKG.name}/dist`,
		project: CWD,
		out: DEF_FILE,
		sendMessage: console.log,
		externs: ['./global.d.ts', ...opts.externs],
		exclude: ['test/**/*.*', ...opts.exclude],
		verbose: false,
	}

	await fs.remove(DEF_FILE)
	await dts(config)

	const content = await fs.readFile(DEF_FILE, 'utf8')

	const newContent = opts.transformFn(
		content.replace(/([\t\f\v]*)private(.*)[\r\n]*/g, '')
			.replace(/\/src\//g, '/dist/')
			.replace(/\/dist\/app\/index'/g, "'")
	)

	await fs.writeFile(DEF_FILE, newContent)
	log.success('Definition generated')
}

// If required by another file
if (module.parent) {
	module.exports = definition
} else { // If executed from terminal
	definition()
}
