import { SPECIE_URL, ERROR_URL, PKMN_URL, FORM_URL } from "./constants";

export const reportNationalNumberError = async (
  error,
  number,
  pokedex_numbers
) => {
  try {
    const url = new URL(ERROR_URL);

    url.searchParams.append("sheet", "NationalNumbers");

    url.searchParams.append("URL", `${SPECIE_URL}${number}/`);

    url.searchParams.append(
      "Problem",
      "Missing nationaldex number on `pokedex_numbers` array"
    );

    url.searchParams.append("pokedex_numbers", JSON.stringify(pokedex_numbers));

    const res = await fetch(url);

    console.error("reportNationalNumberError:", error, res);
  } catch (e) {}
};

export const reportFrontSpriteError = async (form, pkmn) => {
  try {
    const url = new URL(ERROR_URL);

    url.searchParams.append("sheet", "Sprites");

    url.searchParams.append(
      "Problem",
      `Can't derterminate pokémon front sprite`
    );

    url.searchParams.append("Form URL", `${FORM_URL}${form.id}/`);
    url.searchParams.append("Pokemon URL", `${PKMN_URL}${pkmn.id}/`);

    url.searchParams.append("Form Sprites", JSON.stringify(form.sprites));

    url.searchParams.append("Pokemon Sprites", JSON.stringify(pkmn.sprites));

    const res = await fetch(url);

    console.error("reportFrontSpriteError:", error, res);
  } catch (e) {}
};
