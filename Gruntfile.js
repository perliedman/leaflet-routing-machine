module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		browserify: {
			options: {
				src: ['src/L.Routing.Control.js'],
				dest: 'dist/leaflet-routing-machine.js',
				browserifyOptions: {
					standalone: 'L.Routing'
				}
			},
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %> */\n\n'
			},
			build: {
				src: 'dist/leaflet-routing-machine.js',
				dest: 'dist/leaflet-routing-machine.min.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('default', ['browserify', 'uglify']);
};
