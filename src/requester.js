import localforage from "localforage";
import { getRadomItem } from "./utils";

const BASE_URL = "https://pokeapi.co/api/v2";

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

const ajax = async (url) => {
  await apicache.ready();

  const cached = await apicache.getItem(url);
  if (cached) {
    console.log(`from cache ${url}`, cached);
    return cached;
  }

  console.log(`getting: ${url}`);
  const data = await fetch(url).then((res) => res.json());

  await apicache.setItem(url, { ...data, cached: true });
  return data;
};

const arrayBufferToBase64 = (buffer) => {
  const bytes = [...new Uint8Array(buffer)].reduce(
    (acc, b) => acc + String.fromCharCode(b),
    ""
  );

  return "data:image/jpeg;base64," + btoa(bytes);
};

const fetchImage = async (url) => {
  await imgcache.ready();

  const cached = await imgcache.getItem(url);
  if (cached) {
    console.log(`img from cache ${url}`, cached);
    return cached.img;
  }

  console.log(`img getting: ${url}`);
  const img = await fetch(url)
    .then((res) => res.arrayBuffer())
    .then(arrayBufferToBase64);

  await imgcache.setItem(url, { img, cached: true });
  return img;
};

const getPkmnUrl = ({ varieties }) => getRadomItem(varieties).pokemon.url;
const getFormUrl = ({ forms }) => getRadomItem(forms).url;

const languageFilter = ({ language }) => language.name === "en";

const getLanguageObject = ({ names }) =>
  Object.values(names).find(languageFilter);

const getName = (form, specie) =>
  (getLanguageObject(form) || getLanguageObject(specie)).name
    .split(" ")
    .filter((w) => !["Mega", "Alolan", "Totem"].includes(w))
    .join(" ");

const getFlavorText = ({ flavor_text_entries, genera }) => {
  const genus = genera.find(languageFilter).genus;
  const filtered_entries = flavor_text_entries.filter(languageFilter);
  const flavor_text = getRadomItem(filtered_entries).flavor_text;

  return `${genus}: ${flavor_text}`;
};

const getImgs = async (form, pkmn) => {
  const default_sprite_url =
    form.sprites.front_default || pkmn.sprites.front_default;

  if (!default_sprite_url) return {};

  const shiny_sprite_url = form.sprites.front_shiny || pkmn.sprites.front_shiny;

  if (shiny_sprite_url) {
    const images = await Promise.all([
      fetchImage(shiny_sprite_url),
      fetchImage(default_sprite_url),
    ]);

    return { shiny: images[0], common: images[1] };
  }

  const image = await fetchImage(default_sprite_url);

  return { common: image };
};

const fetchTypes = async () => {
  const types = await ajax(`${BASE_URL}/type/`);
  const res = await Promise.all(types.results.map(({ url }) => ajax(url)));

  return res.reduce(
    (acc, { name, names }) => ({
      ...acc,
      [name]: names.find(languageFilter).name,
    }),
    {}
  );
};

const getTypes = (types, pkmn) =>
  pkmn.types
    .sort((a, b) => a.slot - b.slot)
    .map(({ type }) => types[type.name]);

const getNationalNumber = (specie, n) => {
  const { pokedex_numbers } = specie;
  try {
    return pokedex_numbers.find(({ pokedex }) => pokedex.name === "national")
      .entry_number;
  } catch (e) {
    console.error(e, specie);
    return n;
  }
};

const isUltraBeast = ({ abilities }) =>
  abilities.some(({ ability }) => ability.name === "beast-boost");

const requester = async (numbers) => {
  const types = await fetchTypes();

  const promises = numbers.map(async (n) => {
    const specie = await ajax(`${BASE_URL}/pokemon-species/${n}/`);
    let pkmn,
      form,
      imgs,
      count = 0;

    do {
      pkmn = await ajax(getPkmnUrl(specie));
      form = await ajax(getFormUrl(pkmn));
      imgs = await getImgs(form, pkmn);
      count++;
    } while (!imgs.common && count < 5);

    if (!imgs.common) throw new Error(`Fail to get pkmn#${n} image`);

    return {
      id: getNationalNumber(specie, n),
      color: specie.color.name,
      name: getName(form, specie),
      imgs,
      flavor_text: getFlavorText(specie),
      types: getTypes(types, pkmn),
      is_mega: form.is_mega,
      is_baby: specie.is_baby,
      is_ultra_beast: isUltraBeast(pkmn),
      is_alolan_form: form.form_name.includes("alola"),
      is_totem: form.form_name.includes("totem"),
    };
  });

  return Promise.all(promises);
};

export default requester;
