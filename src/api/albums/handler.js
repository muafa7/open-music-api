class AlbumsHandler {
  constructor(service, storageService, albumLikeService, validator, uploadValidator) {
    this._service = service;
    this._storageService = storageService;
    this._albumLikeService = albumLikeService;
    this._validator = validator;
    this._uploadValidator = uploadValidator;
 
    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.postAlbumCoverHandler = this.postAlbumCoverHandler.bind(this);
    this.postAlbumLikeHandler = this.postAlbumLikeHandler.bind(this);
    this.getAlbumsHandler = this.getAlbumsHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.getAlbumLikeByIdHandler = this.getAlbumLikeByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.deleteAlbumLikeByIdHandler = this.deleteAlbumLikeByIdHandler.bind(this);
  }
 
  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
 
    const albumId = await this._service.addAlbum({ name, year });
 
    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }
  
  async postAlbumCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    this._uploadValidator.validateImageHeaders(cover.hapi.headers);
 
    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/albums/images/${filename}`;

    await this._service.editCoverAlbumById(id, { cover: coverUrl });
 
    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }
  
  async postAlbumLikeHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.getAlbumById(albumId);
    await this._albumLikeService.addLike({ albumId, userId });

    const response = h.response({
      status: 'success',
      message: 'Berhasil menyukai album',
    });
    response.code(201);
    return response;
  }
 
  async getAlbumsHandler() {
    const albums = await this._service.getAlbums();
    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }
 
  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }
 
  async getAlbumLikeByIdHandler(request, h) {
    const { id } = request.params;
    const { count, source } = await this._albumLikeService.getAlbumLikes(id);
    const response = h.response({
      status: 'success',
      data: {
        likes: count,
      },
    });
  
    // Set the `X-Data-Source` header based on the source
    response.header('X-Data-Source', source);
  
    return response;
  }
 
  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
 
    await this._service.editAlbumById(id, request.payload);
 
    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }
 
  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
 
    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }
 
  async deleteAlbumLikeByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._albumLikeService.deleteLike(id, credentialId);
 
    return {
      status: 'success',
      message: 'Berhasil batal menyukai album',
    };
  }
}
  
module.exports = AlbumsHandler;
