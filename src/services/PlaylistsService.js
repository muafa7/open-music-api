const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const NotFoundError = require('../exceptions/NotFoundError');
const AuthorizationError = require('../exceptions/AuthorizationError');
const InvariantError = require('../exceptions/InvariantError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
     
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, owner, createdAt, updatedAt],
    };
     
    const result = await this._pool.query(query);
    
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
       
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name , users.username
          FROM playlists
          JOIN users ON users.id = playlists.owner
          LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
          WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };
     
    const result = await this._pool.query(query);
     
    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async getPlaylistSongsById(id) {
    const query = {
      text: `SELECT playlists.id AS playlist_id, playlists.name AS playlist_name,
                songs.id AS song_id, songs.title AS song_title, songs.performer AS song_performer,
                users.username as users_username
                FROM playlists
                LEFT JOIN playlist_songs ON playlist_songs.playlist_id = playlists.id
                LEFT JOIN songs ON songs.id = playlist_songs.song_id
                LEFT JOIN users ON users.id = playlists.owner
                WHERE playlists.id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);
  
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
     
    const songs = result.rows
      .filter((row) => row.song_id)
      .map((row) => ({
        id: row.song_id,
        title: row.song_title,
        performer: row.song_performer,
      }));
  
    const playlist = {
      id: result.rows[0].playlist_id,
      name: result.rows[0].playlist_name,
      username: result.rows[0].users_username,
      songs,
    };
        
    return playlist; 
  }

  async getPlaylistActivitiesById(id) {
    const query = {
      text: `SELECT 
                  playlists.id AS "playlistId",
                  json_agg(
                    json_build_object(
                      'username', users.username,
                      'title', songs.title,
                      'action', activities.action,
                      'time', activities.time
                    )
                  ) AS "activities"
                FROM playlists
                JOIN playlist_song_activities AS activities ON activities.playlist_id = playlists.id
                JOIN users ON users.id = activities.user_id
                JOIN songs ON songs.id = activities.song_id
                WHERE playlists.id = $1 -- Replace $1 with the desired playlist ID
                GROUP BY playlists.id;`,
      values: [id],
    };
    const result = await this._pool.query(query);
  
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
     
    //   const activities = result.rows
    //   .filter(row => row.song_id)
    //   .map(row => ({
    //     id: row.song_id,
    //     title: row.song_title,
    //     performer: row.song_performer,
    //   }));
  
    //   const playlist = {
    //   playlistId: result.rows[0].playlist_id,
    //   name: result.rows[0].playlist_name,
    //   username: result.rows[0].users_username,
    //   activities: activities
    // };
        
    return result.rows[0]; 
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;