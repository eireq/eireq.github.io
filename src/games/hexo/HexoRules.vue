<template>
  <div class="rules">
    <p>
      X opens with one stone in the middle (h8 on base 8, m13 on base 13).
      after that every turn is two stones, starting with O.
    </p>
    <p>six in a row on any of the three axes wins. the winning move gets a #.</p>
    <p>
      check means whoever's moving can finish a line with the stones they have left this turn.
      the stones in that line get marked.
    </p>
    <p>you can resign on your turn and the other side wins. clocks only tick on your turn.</p>
    <p>type a square like g7 to play it. flip turns the board around.</p>
    <p>
      together: pick a room name. the room remembers the game and the board size.
      you start as X, send the invite, and with two players they're O. rematch swaps sides.
      with three or four, O, Y and Z each get their own invite button.
      the box under the moves is chat.
    </p>
    <template v-if="!brief">
      <p>
        triangle, square and octagon use the same turns. on the octagon board you also play in the diamonds.
        radial is rings and spokes: six around a ring or six outward on a spoke.
        pentagon fills five sides with the same triangles.
      </p>
      <p>
        duck: after your stones, move the duck. nobody can play on it. king duck also shuts down the ring around it:
        nobody plays there, and stones already there don't count toward a line.
      </p>
      <p>
        egyptian sets a soft cap. once you're over it you can lift up to 2 of your older stones, or leave them.
        an echo never lifts a stone.
      </p>
      <p>
        echo copies a stone onto its mirror two full turns later. a duck echo only moves the duck if it's still on that cell.
        orbit then turns every stone one step, except the duck.
        meteor clears the outer ring every third turn. a copy made that same turn survives.
      </p>
      <p>raid: after your stones, take one of theirs. it's yours now.</p>
      <p>slide: your second action can move one of your stones onto an empty neighbor.</p>
      <p>frost: stones you placed this turn don't count toward a line until the turn ends.</p>
      <p>pair: both stones in a turn have to touch. the opening stone is free.</p>
      <p>scatter: both stones in a turn can't touch.</p>
      <p>siege: after the opening, every stone has to go next to an opponent's stone.</p>
      <p>
        pendulum: once everyone has had a turn, every stone steps one ring toward the middle.
        the center stone stays put.
      </p>
      <p>mine: your second action can plant a mine. the next stone played there is lost, and so is the mine.</p>
      <p v-if="bloom">
        rift bloom: the shimmering cells move every turn. play on one and a ghost grows on the mirror.
        if two of your stones touch the ghost before it fades, it turns into a stone.
      </p>
    </template>
  </div>
</template>

<script setup>
// brief is the short version shown the first time someone opens hexo
defineProps({
  brief: { type: Boolean, default: false },
  bloom: { type: Boolean, default: false },
});
</script>

<style scoped>
.rules {
  display: grid;
  gap: 10px;
  color: #bbb;
  font-size: 14px;
  line-height: 1.45;
}

.rules p {
  margin: 0;
}
</style>
