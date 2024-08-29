class PlaylistsService {
    constructor() {
      this._pool = new Pool();
    }

    async addPlaylist({ name, owner }) {
        const id = 'playlist-' + nanoid(16);
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
          LEFT JOIN users ON users.id = playlists.owner
          WHERE playlists.owner = $1
          GROUP BY playlists.id`,
          values: [owner],
        };

        const result = await this._pool.query(query);
        return result.rows.map(mapDBToModel);
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

    async addPlaylistSong({id, songId}) {

    }

    async getPlaylistSongsById(id) {
        const query = {
          text: `SELECT playlists.id AS playlist_id, playlists.name AS playlist_name, playlists.year AS playlist_year,
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
        .filter(row => row.song_id)
        .map(row => ({
          id: row.song_id,
          title: row.song_title,
          performer: row.song_performer,
        }));
  
  
        const playlist = {
        id: result.rows[0].playlist_id,
        name: result.rows[0].playlist_name,
        username: result.rows[0].users_username,
        songs: songs
      };
        
        return playlist; 
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
      const note = result.rows[0];
      if (note.owner !== owner) {
        throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
      }
    }

    async verifyPlaylistAccess(noteId, userId) {
      try {
        await this.verifyPlaylistOwner(noteId, userId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw error;
        }
        try {
          await this._collaborationService.verifyCollaborator(noteId, userId);
        } catch {
          throw error;
        }
      }
    }
}