const AlbumsHandler = require('./handler');
const routes = require('./routes');
 
module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, {
    service, storageService, albumLikeService, validator, uploadValidator, 
  }) => {
    const albumsHandler = new AlbumsHandler(
      service, storageService, albumLikeService, validator, uploadValidator,
    );
    server.route(routes(albumsHandler));
  },
};
