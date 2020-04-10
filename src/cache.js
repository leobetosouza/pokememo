import localforage from "localforage";

const apicache = localforage.createInstance({
  driver: localforage.INDEXEDDB,
  name: "pokeapi-cache",
  version: 1.0,
  storeName: "apicache",
  description: "Cache of PokeAPI responses",
});

const imgcache = localforage.createInstance({
  driver: localforage.INDEXEDDB,
  name: "pokeapi-images-cache",
  version: 1.0,
  storeName: "imgcache",
  description: "Cache of PokeAPI images",
});

const caches = {
  img: imgcache,
  api: apicache,
};

const createCachedRequester = (type, func) => {
  const cache = caches[type];

  return async (url) => {
    await cache.ready();

    const cached = await cache.getItem(url);

    if (cached) return cached;

    console.log(`getting: ${url}`);
    const data = await func(url);

    await cache.setItem(url, data);

    return data;
  };
};

export default createCachedRequester;
