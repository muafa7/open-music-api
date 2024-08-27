const mapDBToAlbumModel = ({ 
    id,
    name,
    year,
    createdAt,
    updatedAt,
  }) => ({
    id,
    name,
    year,
    createdAt,
    updatedAt
  });

const mapDBToSongModel = ({ 
    id,
    title,
    year,
    genre,
    performer,
    duration,
    albumId,
    createdAt,
    updatedAt,
  }) => ({
    id,
    title,
    year,
    genre,
    performer,
    duration,
    albumId,
    createdAt,
    updatedAt
  });
   
module.exports = { mapDBToAlbumModel, mapDBToSongModel };