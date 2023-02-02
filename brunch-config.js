exports.paths   = { public: './docs/', watched: ['./source/'] };
exports.watcher = { awaitWriteFinish: true };

exports.files   = {
	stylesheets: {joinTo: 'index.css'},
	templates:   {joinTo: 'templates.js'},
	javascripts: {},
};

exports.files.javascripts.entryPoints = {
	'source/index.js':   {'index.js':   /^(source)/},
	// 'source/service.js': 'service.js',
};

exports.files.javascripts.joinTo = {'vendor.js':  [/^node_modules/],};

exports.modules = {};
exports.modules.autoRequire = {
	'index.js': ['index']
	// , 'service.js': ['service']
};

exports.modules.nameCleaner = path => path.replace(/^(source)\//, '');

exports.plugins = {};
exports.plugins.preval = { tokens: { BUILD_TIME: ()=> Date.now() } };

exports.plugins.raw = {
	pattern: /\.(html|svg)$/,
	wrapper: content => `module.exports = ${JSON.stringify(content)}`
};

exports.plugins.babel = {
	presets: ['@babel/preset-env'],
	plugins: ["@babel/plugin-proposal-class-properties"]
};

// exports.hooks = {};
// const fs = require('fs');

// exports.hooks.preCompile = () => fs
// .readdirSync(exports.paths.public)
// .forEach(f => fs.unlinkSync(exports.paths.public + '/' + f));