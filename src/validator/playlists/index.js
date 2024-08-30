const { PlaylistSchema, PlaylistSongSchema } = require('./schema');
const InvariantError = require('../../exceptions/InvariantError');
 
const PlaylistsValidator = {
  validatePlaylistPayload: (payload) => {
    const validationResult = PlaylistSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },

  validatePlaylistSongPayload: (payload) => {
    const validationResult = PlaylistSongSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};
 
module.exports = PlaylistsValidator;