(function(root) {
  'use strict';

  const ROOM_LIMIT = 8;
  const PROJECT_LIMIT = 24;
  const IMAGE_LIMIT = 180000;
  const PROJECT_IMAGE_LIMIT = 3600000;
  const PROJECT_FILE_LIMIT = 8000000;
  const imagePattern = /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/;

  function validate(job) {
    let count = 0, size = 0;
    for (const room of [...job.rooms, ...(job.archivedRooms || [])]) {
      const photos = room.photos ?? [];
      if (!Array.isArray(photos) || photos.length > ROOM_LIMIT) throw Error(`A room supports up to ${ROOM_LIMIT} photos.`);
      const ids = new Set();
      for (const photo of photos) {
        if (!photo || typeof photo.id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(photo.id) || ids.has(photo.id) || typeof photo.name !== 'string' || photo.name.length > 100 || typeof photo.data !== 'string' || photo.data.length > IMAGE_LIMIT || !imagePattern.test(photo.data)) throw Error('A saved room photo is invalid.');
        ids.add(photo.id);
        count++;
        size += photo.data.length;
        if (count > PROJECT_LIMIT || size > PROJECT_IMAGE_LIMIT) throw Error('This job has reached its photo limit, including archived rooms.');
      }
      room.photos = photos.map(({id,name,data})=>({id,name,data}));
    }
    return { count, size };
  }

  function withoutPhotos(job) {
    const omit = ({ photos, ...room }) => room;
    return { ...job, rooms: job.rooms.map(omit), archivedRooms: (job.archivedRooms || []).map(omit) };
  }

  async function compress(file) {
    if (file.size > 25000000) throw Error('Use an image under 25 MB.');
    const image = await root.createImageBitmap(file).catch(() => { throw Error('Use a JPEG, PNG or WebP image.'); });
    const canvas = root.document.createElement('canvas');
    try {
      const context = canvas.getContext('2d', { alpha: false });
      for (const dimension of [1600, 1200, 900, 650, 480]) {
        const scale = Math.min(1, dimension / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        for (const quality of [0.78, 0.65, 0.52]) {
          const data = canvas.toDataURL('image/jpeg', quality);
          if (data.length <= IMAGE_LIMIT && imagePattern.test(data)) return data;
        }
      }
      throw Error('The image could not be compressed. Try a smaller image.');
    } finally {
      image.close();
    }
  }

  const api = { ROOM_LIMIT, PROJECT_LIMIT, PROJECT_FILE_LIMIT, validate, withoutPhotos, compress };
  if (typeof module !== 'undefined') module.exports = api;
  else root.JobPhotos = api;
})(globalThis);
