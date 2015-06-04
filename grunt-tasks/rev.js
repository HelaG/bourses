module.exports = {
  dist: {
    files: {
      src: [
        '<%= app.dirs.dist %>/{,*/}*.js',
        '<%= app.dirs.dist %>/{,*/}*.css',
        '<%= app.dirs.dist %>/assets/fonts/*',
        '!<%= app.dirs.dist %>/server/*',
        '!<%= app.dirs.dist %>/bower_components/spin.js'
      ]
    }
  }
};
