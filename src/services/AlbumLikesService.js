const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../exceptions/InvariantError');

class AlbumLikesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addLike({ albumId, userId }) {
    await this.verifyLike(albumId, userId);
    const id = `likes-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };
   
    const result = await this._pool.query(query);
   
    if (!result.rows.length) {
      throw new InvariantError('Gagal menyukai album');
    }
    await this._cacheService.delete(`albumLikes:${albumId}`);
    return result.rows[0].id;
  }

  async verifyLike(albumId, userId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    const result = await this._pool.query(query);
    if (result.rows.length) {
      throw new InvariantError('Anda sudah menyukai album');
    }
  }

  async deleteLike(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };
 
    const result = await this._pool.query(query);
 
    if (!result.rows.length) {
      throw new InvariantError('Gagal membatalkan like');
    }
    
    await this._cacheService.delete(`albumLikes:${albumId}`);
  }

  async getAlbumLikes(albumId) {
    try {
      // mendapatkan like dari cache
      const result = await this._cacheService.get(`albumLikes:${albumId}`);
      return { count: parseInt(result, 10), source: 'cache' };
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };
   
      const result = await this._pool.query(query);
      const count = parseInt(result.rows[0].count, 10);
      
      await this._cacheService.set(`albumLikes:${albumId}`, count.toString());
   
      return { count, source: 'database' };
    }
  }
}

module.exports = AlbumLikesService;