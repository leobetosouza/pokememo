<script>
  import { onMount } from "svelte";
  import requester from "./requester";

  const NUMBER_OF_PKMN = 807;

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
      ...shuffle(array).map(item => ({ ...item, img: item.img[0] })),
      ...shuffle(array).map(item => ({ ...item, img: item.img[1] }))
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

  const getPkmnNumbers = () => {
    const n = +prompt("How many pairs do you want?");
    return shuffle(
      Array.from(Array(NUMBER_OF_PKMN).keys(), (_, i) => i + 1)
    ).slice(0, n);
  };

  let cards = [];
  let actives = [];
  let hasStarted = false;
  let hasFinished = false;
  let cardTurns = 0;

  const turn = async item => {
    cardTurns++;
    actives = [item, ...actives];

    if (actives.length % 2 === 0 && item.id !== actives[1].id) {
      await delay(600);
      actives = actives.slice(2, actives.length);
    }

    if (actives.length === cards.length) {
      alert(`PARABAINS! You did it in ${cardTurns} card turns!`);
      hasFinished = true;
    }
  };

  onMount(async () => {
    const numbers = getPkmnNumbers();
    const items = await requester(numbers);

    cards = duplicateAndRandomize(items);

    await alternate_rallentandi(
      3,
      () => (actives = cards.map(({ id }, i) => ({ id, i }))),
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
    background: #000;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-gap: 8px;
  }

  .card,
  img {
    width: 100%;
    margin: 0;
  }

  .card {
    background: #ccc;
    border: 3px solid;
    height: 15vw;
  }

  .card-back {
    background: #fff;
    border: 3px solid orange;
  }

  .card-success {
    background: orange;
  }
</style>

<main
  class="main {hasStarted ? 'game-started' : ''}
  {hasFinished ? 'game-finished' : ''}">
  <header class="header">
    <h1>PkMn Memory Puzzle</h1>
    <p>
      Complete: {hasStarted ? actives.length : 0}/{cards.length} | Turns: {cardTurns}
    </p>
  </header>
  <div class="cards">
    {#each cards as { color, name, id, img }, i}
      {#if actives.find(card => card.i === i)}
        <figure
          class="card card-face {hasStarted && actives.reduce((acc, c) => (c.id === id ? acc + 1 : acc), 0) === 2 ? 'card-success' : ''}"
          style="border-color: {color}">
          <img src={img} alt={name} />
          <figcaption>#{id} {name}</figcaption>
        </figure>
      {:else}
        <figure
          class="card card-back"
          on:click|once={() => hasStarted && turn({ i, id })}>
          pkmn
        </figure>
      {/if}
    {:else}
      <!-- this block renders when cards.length === 0 -->
      <p>loading...</p>
    {/each}
  </div>
</main>
