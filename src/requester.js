import { getRadomItem } from "./utils";

const BASE_URL = "https://pokeapi.co/api/v2";

const ajax = async url => await fetch(url).then(res => res.json());

const getPkmnUrl = ({ varieties }) => getRadomItem(varieties).pokemon.url;
const getFormUrl = ({ forms }) => getRadomItem(forms).url;

const languageFilter = ({ language }) => language.name === "en";

const getLanguageObject = ({ names }) =>
  Object.values(names).find(languageFilter);

const getName = (form, specie) =>
  (getLanguageObject(form) || getLanguageObject(specie)).name;

const getFlavorText = ({ flavor_text_entries }) => {
  const filtered_entries = flavor_text_entries.filter(languageFilter);
  return getRadomItem(filtered_entries).flavor_text;
};

const arrayBufferToBase64 = buffer => {
  const bytes = [...new Uint8Array(buffer)].reduce(
    (acc, b) => acc + String.fromCharCode(b),
    ""
  );

  return "data:image/jpeg;base64," + btoa(bytes);
};

const fetchImage = async url =>
  await fetch(url)
    .then(res => res.arrayBuffer())
    .then(arrayBufferToBase64);

const getImgs = async (form, pkmn) => {
  const default_sprite_url =
    form.sprites.front_default || pkmn.sprites.front_default;

  if (!default_sprite_url) return {};

  const shiny_sprite_url = form.sprites.front_shiny || pkmn.sprites.front_shiny;

  if (shiny_sprite_url) {
    const images = await Promise.all([
      fetchImage(shiny_sprite_url),
      fetchImage(default_sprite_url)
    ]);

    return { shiny: images[0], common: images[1] };
  }

  const image = await fetchImage(default_sprite_url);

  return { common: image };
};

const requester = async numbers => {
  const promises = numbers.map(async n => {
    const specie = await ajax(`${BASE_URL}/pokemon-species/${n}/`);
    let pkmn, form, imgs;

    do {
      pkmn = await ajax(getPkmnUrl(specie));
      form = await ajax(getFormUrl(pkmn));
      imgs = await getImgs(form, pkmn);
    } while (!imgs.common);

    return {
      id: n,
      color: specie.color.name,
      name: getName(form, specie),
      imgs,
      flavor_text: getFlavorText(specie)
    };
  });

  return Promise.all(promises);
};

export default requester;
