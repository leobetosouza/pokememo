import { getRadomItem } from "./utils";
import { reportNationalNumberError } from "./error";

export const languageFilter = ({ language }) => language.name === "en";

export const getPkmnUrl = ({ varieties }) =>
  getRadomItem(varieties).pokemon.url;

export const getFormUrl = ({ forms }) => getRadomItem(forms).url;

export const getLanguageObject = ({ names }) =>
  Object.values(names).find(languageFilter);

export const getName = (form, specie) =>
  (getLanguageObject(form) || getLanguageObject(specie)).name
    .split(" ")
    .filter((w) => !["Mega", "Alolan", "Totem"].includes(w))
    .join(" ");

export const getFlavorText = ({ flavor_text_entries, genera }) => {
  const genus = genera.find(languageFilter).genus;
  const filtered_entries = flavor_text_entries.filter(languageFilter);
  const flavor_text = getRadomItem(filtered_entries).flavor_text;

  return `${genus}: ${flavor_text}`;
};

export const getTypes = (types, pkmn) =>
  pkmn.types
    .sort((a, b) => a.slot - b.slot)
    .map(({ type }) => types[type.name]);

export const getNationalNumber = (specie, n) => {
  const { pokedex_numbers } = specie;

  try {
    return pokedex_numbers.find(({ pokedex }) => pokedex.name === "national")
      .entry_number;
  } catch (e) {
    reportNationalNumberError(e, n, pokedex_numbers);
    return n;
  }
};

export const isUltraBeast = ({ abilities }) =>
  abilities.some(({ ability }) => ability.name === "beast-boost");
