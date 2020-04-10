import { TYPE_URL, SPECIE_URL } from "./constants";
import { arrayBufferToBase64 } from "./utils";
import { reportFrontSpriteError } from "./error";

import {
  languageFilter,
  getName,
  getPkmnUrl,
  getFormUrl,
  getNationalNumber,
  getFlavorText,
  getTypes,
  isUltraBeast,
} from "./common";
import createCachedRequester from "./cache";

const ajax = createCachedRequester("api", async (url) =>
  fetch(url).then((res) => res.json())
);

const fetchImage = createCachedRequester("img", async (url) =>
  fetch(url)
    .then((res) => res.arrayBuffer())
    .then(arrayBufferToBase64)
);

const getImgs = async (form, pkmn) => {
  const default_sprite_url =
    form.sprites.front_default || pkmn.sprites.front_default;

  if (!default_sprite_url) {
    reportFrontSpriteError(form, pkmn);
    return {};
  }

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
  const types = await ajax(`${TYPE_URL}`);
  const res = await Promise.all(types.results.map(({ url }) => ajax(url)));

  return res.reduce(
    (acc, { name, names }) => ({
      ...acc,
      [name]: names.find(languageFilter).name,
    }),
    {}
  );
};

const requester = async (numbers) => {
  const types = await fetchTypes();

  const promises = numbers.map(async (n) => {
    const specie = await ajax(`${SPECIE_URL}${n}/`);

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
