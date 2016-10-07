module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify: {
			control: {
				src: ['src/L.Routing.Control.js'],
				dest: 'dist/leaflet-routing-machine.js',
				options: {
					browserifyOptions: {
						transform: 'browserify-shim',
						standalone: 'L.Routing'
					},
					banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
					'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
					' * Copyright (c) 2013-2016 Per Liedman\n' +
					' * Distributed under the <%= pkg.license %> license */\n\n'
					}
			}
		},
		uglify: {
			options: {
				banner: '/* <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				' * Copyright (c) 2013-2016 Per Liedman\n' +
				' * Distributed under the <%= pkg.license %> license */\n\n'
			},
			build: {
				src: 'dist/leaflet-routing-machine.js',
				dest: 'dist/leaflet-routing-machine.min.js'
			}
		},
		release: {
			email: 'per@liedman.net',
			name: 'Per Liedman',
			tasks: ['default', 'changelog']
		},
		copy: {
			vendor: {
				cwd: 'css',
				src: ['**'],
				dest: 'dist/',
				expand: true
			}
		},
		'gh-pages': {
			options: {
				add: true
			},
			src: ['dist/**']
		}
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-semantic-release');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-gh-pages');
	grunt.registerTask('default', ['browserify', 'uglify', 'copy']);
};
