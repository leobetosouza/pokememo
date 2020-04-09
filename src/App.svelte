<script>
  import { onMount, tick } from "svelte";
  import requester from "./requester";
  import { getRadomItem } from "./utils";

  const NUMBER_OF_PKMN = 807;

  const quotes = [
    "Strong Pkmn. Weak Pkmn. That is only the selfish perception of people. Truly skilled Trainers should try to win with the Pkmn they love best.",
    'Whenever I’m feeling down after losing a battle, I think, "at least I’ve still got my shorts!"',
    "There are bad ways to win, and good ways to lose. What’s interesting and troubling is that it’s not always clear which is which. A flipped coin doesn’t always land on heads or tails. Sometimes it may never land at all.",
    "You said you have a dream… That dream… Make it come true! Make your wonderful dream a reality, and it will become your truth! If anyone can, it’s you! Well, then… Farewell!",
    "Getting wrapped up in worries is bad for your body and spirit. That’s when you must short out your logic circuits and reboot your heart.",
    "I heard that he’ll do whatever it takes to get rare Pkmn. He’s not above doing all sorts of things, I’ve heard."
  ];

  const shuffle = array => {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const duplicateAndRandomize = array =>
    shuffle([
      ...shuffle(array).map(item => ({
        ...item,
        img: item.imgs.shiny || item.imgs.common,
        is_shiny: !!item.imgs.shiny
      })),
      ...shuffle(array).map(item => ({
        ...item,
        img: item.imgs.common,
        is_shiny: false
      }))
    ]);

  const delay = async ms =>
    new Promise(resolve => setTimeout(() => resolve(), ms));

  const alternate_rallentandi = async (times, func1, func2) => {
    const baseDelay = 600;
    do {
      func1();
      await delay(baseDelay * times);
      func2();
      await delay(baseDelay);
    } while (--times);
  };

  const getPkmnNumbers = n => {
    return shuffle(
      Array.from(Array(NUMBER_OF_PKMN).keys(), (_, i) => i + 1)
    ).slice(0, Math.max(2, Math.min(n, 20)));
  };

  let pkmns = {};
  let cards = [];
  let actives = [];
  let hasStarted = false;
  let hasFinished = false;
  let cardTurns = 0;
  let action_sentence = "Looking for pkmn in the tall glass...";
  let pkdex_text = "";

  $: isActive = i => actives.find(card => card.i === i);
  $: hasMatched = id =>
    actives.reduce((acc, c) => (c.id === id ? acc + 1 : acc), 0) === 2;

  $: hasNameBadge = ({ is_mega, is_alolan_form, is_totem }) =>
    is_mega || is_alolan_form || is_totem;

  const turn = async card => {
    const pkmn = pkmns[card.id];
    const name = pkmn.name.toUpperCase();
    pkdex_text = "";

    cardTurns++;
    actives = [card, ...actives];

    if (actives.length % 2 === 1) {
      // one pkmn selected
      action_sentence = `Wild ${card.shiny ? "shiny " : ""}${name} appeared!`;
    } else {
      // two pkmn selected
      if (card.id !== actives[1].id) {
        // not a catch
        action_sentence = `${pkmns[actives[1].id].name.toUpperCase()} fled!`;
        await delay(600);
        actives = actives.slice(2, actives.length);
        action_sentence = getRadomItem(quotes);
      } else {
        // a catch!
        action_sentence = `All right! ${name} has caught! New pkdex data will be added for ${name}!`;
        await delay(600);
        pkdex_text = pkmn.flavor_text;
      }
    }

    if (actives.length === cards.length) {
      alert(`PARABAINS! You did it in ${cardTurns} card turns!`);
      hasFinished = true;
    }
  };

  onMount(async () => {
    const n = +prompt("How many pairs do you want? (min 2, max 20)");
    let numbers, items;

    while (true) {
      try {
        numbers = getPkmnNumbers(n);
        items = await requester(numbers);
        break;
      } catch (e) {
        console.error(e);
      }
    }

    pkmns = items.reduce((acc, item) => ((acc[item.id] = item), acc), {});
    cards = duplicateAndRandomize(items);

    const turnedCards = cards.map(({ id }, i) => ({ id, i }));

    await alternate_rallentandi(
      3,
      () => (actives = turnedCards),
      () => (actives = [])
    );

    hasStarted = true;
  });
</script>

<style>
  * {
    box-sizing: border-box;
  }

  .main {
    background: #000;
    padding: 8px;
  }

  .header {
    color: #fff;
  }

  .cards {
    background: yellowgreen;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    /* grid-template-rows: repeat(auto-fill, minmax(300px, 1.5fr)); */
    grid-gap: 1em;
    place-items: stretch stretch;
    place-content: stretch stretch;
  }

  .card {
    margin: 0;
    width: 100%;
    height: 100%;
    border-radius: 15px;

    transition: 0.4s;
  }
  .card-face,
  .card-back {
    margin: 0;
    width: 100%;
    height: 100%;
    min-height: 300px;
    border-radius: 15px;
  }
  .card-face {
    padding: 1em;
    text-align: left;

    display: flex;
    flex-direction: column;

    position: relative;

    box-shadow: 0px 5px 20px -10px #3a1c71;
  }
  .card__blue {
    background: linear-gradient(120deg, #1cb5e0 0%, #000851 100%);
  }
  .card__green {
    background: linear-gradient(
      140deg,
      rgba(196, 218, 61, 1) 0%,
      rgba(110, 127, 14, 1) 69%,
      rgba(39, 80, 9, 1) 100%
    );
  }
  .card__red {
    background: linear-gradient(
      0deg,
      rgba(199, 24, 0, 1) 10%,
      rgba(252, 194, 69, 1) 100%
    );
  }
  .card__yellow {
    background: linear-gradient(
      90deg,
      rgba(255, 222, 0, 1) 34%,
      rgba(232, 255, 153, 1) 83%
    );
  }
  .card__pink {
    background: linear-gradient(
      140deg,
      rgba(255, 167, 249, 1) 0%,
      rgba(255, 44, 195, 1) 39%,
      rgba(255, 227, 167, 1) 100%
    );
  }
  .card__purple {
    background-image: linear-gradient(315deg, #2b1331 0%, #b9abcf 74%);
  }
  .card__brown {
    background: linear-gradient(110deg, #fdbb2d 0%, #3a1c71 100%);
  }
  .card__black {
    background: linear-gradient(
      20deg,
      rgba(25, 25, 25, 1) 0%,
      rgba(16, 11, 50, 1) 33%,
      rgba(92, 2, 73, 1) 100%
    );
  }
  .card__white {
    background-image: linear-gradient(315deg, #ffffff 0%, #d7e1ec 74%);
  }
  .card__gray {
    background-image: linear-gradient(315deg, #bdd4e7 0%, #8693ab 74%);
  }
  .card:hover {
    box-shadow: 0px 13px 30px -15px #000000;
    animation: bounce 0.5s linear;
  }
  .card-data {
    background-color: rgba(255, 255, 255, 0.65);
    padding: 0.75em 0.75em 0;
    position: relative;
    border-radius: 0 0 3px 3px;
    height: 100%;
  }
  .card-name {
    /* font-size: calc(12px + (24 - 12) * ((100vw - 400px) / (800 - 400))); */
  }
  .card-image-container {
    background-color: rgba(0, 0, 0, 0.7);
    text-align: center;
    padding: 1em 1em 0;
    border-radius: 3px 3px 0 0;
    position: relative;
    overflow: hidden;
    height: 130%;
  }
  .card-image-container img:after {
    content: "";
    clear: both;
    display: block;
  }
  .card-image-container__shiny img {
    animation: grow 4s infinite 0s;
  }
  .card-image-container__shiny:before {
    content: "";

    position: absolute;
    top: 0;
    z-index: 1;

    width: 60%;
    height: 100%;
    opacity: 0;
    animation: move 4s infinite 1s;

    background-image: linear-gradient(
      to left,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.03) 1%,
      rgba(255, 255, 255, 0.6) 30%,
      rgba(255, 255, 255, 0.85) 50%,
      rgba(255, 255, 255, 0.85) 70%,
      rgba(255, 255, 255, 0.85) 71%,
      rgba(255, 255, 255, 0) 100%
    );
  }
  img {
    height: 150px;
    margin: auto;
    display: inline-block;
  }
  .card-name {
    margin: 0;
  }
  .card-name-badge {
    display: block;
    font-size: 50%;
    font-style: italic;
  }
  .card-back {
    background: #fff;
    border: 1em solid orange;
    border-radius: 15px;
    cursor: pointer;
  }

  .card-success {
    /* background-color: #e7eff9;
    background-image: linear-gradient(315deg, #e7eff9 0%, #cfd6e6 74%); */
  }

  @keyframes bounce {
    20% {
      transform: translateY(-6px);
    }
    40% {
      transform: translateY(0px);
    }
    60% {
      transform: translateY(-2px);
    }
    80% {
      transform: translateY(-0px);
    }
  }
  @keyframes move {
    0% {
      transform: skew(-25deg, 0deg) translateX(-120%);
      opacity: 0.2;
    }
    15% {
      opacity: 0.1;
    }
    48% {
      opacity: 0;
    }
    50% {
      opacity: 0.2;
    }
    100% {
      transform: skew(-25deg, 0deg) translateX(180%);
      /* opacity: 0.2; */
    }
  }
  @keyframes grow {
    0% {
      filter: brightness(1);
    }

    50% {
      filter: brightness(0);
    }

    100% {
      filter: brightness(1);
    }
  }
</style>

<main
  class="main {hasStarted ? 'game-started' : ''}
  {hasFinished ? 'game-finished' : ''}">
  <header class="header">
    <h1>PkMn Memory Puzzle</h1>
    <p>
      Catched: {hasStarted ? actives.length : 0}/{cards.length} | Attempts: {cardTurns}
    </p>
    <p>
      <strong>{action_sentence}</strong>
    </p>
    {#if pkdex_text}
      <p>{pkdex_text}</p>
    {/if}
  </header>
  <div class="cards">
    {#each cards as { color, name, id, img, shiny, types, is_mega, is_alolan_form, is_shiny, is_totem }, i}
      <div class="card">
        {#if isActive(i)}
          <figure
            class="card-face card__{color}
            {hasStarted && hasMatched(id) ? 'card-success' : ''}">
            <header
              class="card-image-container {is_shiny ? 'card-image-container__shiny' : ''}">
              <img src={img} alt={name} class="card-image" />
            </header>
            <figcaption class="card-data">
              <h1 class="card-name">
                {#if hasNameBadge({ is_mega, is_alolan_form, is_totem })}
                  <span class="card-name-badge">
                    {#if is_mega}
                      <span class="card-name-badge__mega">Mega</span>
                    {/if}
                    {#if is_totem}
                      <span class="card-name-badge__totem">Totem</span>
                    {/if}
                    {#if is_alolan_form}
                      <span class="card-name-badge__alola">Alolan</span>
                    {/if}
                  </span>
                {/if}
                {name}
              </h1>
              <strong class="card-number">#{id}</strong>
              <strong class="card-type">
                {#each types as type, i}
                  {type}{i + 1 !== types.length ? '/' : ''}
                {/each}
              </strong>
            </figcaption>
          </figure>
        {:else if hasStarted}
          <figure
            class="card-back"
            on:click|once={() => turn({ i, id, shiny })}>
            Gotta catch 'em all!
          </figure>
        {:else}
          <figure class="card-back">Gotta catch 'em all!</figure>
        {/if}
      </div>
    {/each}
  </div>
</main>
