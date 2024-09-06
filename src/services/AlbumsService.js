const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../exceptions/InvariantError');
const { mapDBToAlbumModel } = require('../utils');
const NotFoundError = require('../exceptions/NotFoundError');
 
class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
 
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };
 
    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }
   
    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result.rows.map(mapDBToAlbumModel);
  }

  async getAlbumById(id) {
    const query = {
      text: `SELECT albums.id AS album_id, albums.name AS album_name, albums.year AS album_year, albums.cover AS album_cover,
              songs.id AS song_id, songs.title AS song_title, songs.performer AS song_performer
              FROM albums
              LEFT JOIN songs ON songs."albumId" = albums.id
              WHERE albums.id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
   
    const songs = result.rows
      .filter((row) => row.song_id)
      .map((row) => ({
        id: row.song_id,
        title: row.song_title,
        performer: row.song_performer,
      }));

    const album = {
      id: result.rows[0].album_id,
      name: result.rows[0].album_name,
      year: result.rows[0].album_year,
      coverUrl: result.rows[0].album_cover,
      songs,
    };
      
    return album; 
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, "updatedAt" = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };
   
    const result = await this._pool.query(query);
   
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async editCoverAlbumById(id, { cover }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET cover = $1, "updatedAt" = $2 WHERE id = $3 RETURNING id',
      values: [cover, updatedAt, id],
    };

    const result = await this._pool.query(query);
   
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };
 
    const result = await this._pool.query(query);
 
    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }
}
 
module.exports = AlbumsService;