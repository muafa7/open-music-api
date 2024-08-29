/* eslint-disable camelcase */
 
exports.shorthands = undefined;
 
exports.up = (pgm) => {
  // membuat album baru.
  pgm.sql(`INSERT INTO albums(id, name, year, "createdAt", "updatedAt") VALUES ('old_albums', 'old_albums', '1111', current_timestamp, current_timestamp)`);
 
  // mengubah nilai albumId pada songs yang albumId-nya bernilai NULL
  pgm.sql(`UPDATE songs SET "albumId" = 'old_albums' WHERE "albumId" IS NULL`);
 
  // memberikan constraint foreign key pada albumId terhadap kolom id dari tabel albums
  pgm.addConstraint('songs', 'fk_songs.albumid_albums.id', 'FOREIGN KEY("albumId") REFERENCES albums(id) ON DELETE CASCADE');
};
 
exports.down = (pgm) => {
  // menghapus constraint fk_songs.albumid_albums.id pada tabel songs
  pgm.dropConstraint('songs', 'fk_songs.albumid_albums.id');
 
  // mengubah nilai albumId old_albums pada album menjadi NULL
  pgm.sql(`UPDATE songs SET "albumId" = NULL WHERE "albumId" = 'old_albums'`);
 
  // menghapus album baru.
  pgm.sql("DELETE FROM albums WHERE id = 'old_albums'");
};