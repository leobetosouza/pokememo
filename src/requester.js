const BASE_URL = "https://pokeapi.co/api/v2";

const ajax = async url => await fetch(url).then(res => res.json());

const getRadomItem = array => array[(array.length * Math.random()) | 0];

const getPkmnUrl = ({ varieties }) => getRadomItem(varieties).pokemon.url;
const getFormUrl = ({ forms }) => getRadomItem(forms).url;

const languageFilter = ({ names }) =>
  Object.values(names).find(({ language }) => language.name === "en");

const getName = (form, specie) =>
  (languageFilter(form) || languageFilter(specie)).name;

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

  if (!default_sprite_url) return [];

  const shiny_sprite_url = form.sprites.front_shiny || pkmn.sprites.front_shiny;

  if (shiny_sprite_url) {
    return Promise.all([
      fetchImage(shiny_sprite_url),
      fetchImage(default_sprite_url)
    ]);
  }

  const image = await fetchImage(default_sprite_url);

  return [image, image];
};

const requester = async numbers => {
  const promises = numbers.map(async n => {
    const specie = await ajax(`${BASE_URL}/pokemon-species/${n}/`);
    let pkmn, form, img;

    do {
      pkmn = await ajax(getPkmnUrl(specie));
      form = await ajax(getFormUrl(pkmn));
      img = await getImgs(form, pkmn);
    } while (!img[0]);

    return {
      id: n,
      color: specie.color.name,
      name: getName(form, specie),
      img
    };
  });

  return Promise.all(promises);
};

export default requester;
