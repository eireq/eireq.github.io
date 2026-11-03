<template>
  <div class="rules">
    <p v-for="(line, index) in RULES[game] || []" :key="index">{{ line }}</p>
    <p>type a square like h3 to play it. flip turns the board around. clocks only tick on your turn.</p>
  </div>
</template>

<script setup>
defineProps({
  game: { type: String, required: true },
});

const RULES = {
  bluding: [
    "red links the square dots and wants to join top to bottom. blue links the round dots and wants left to right.",
    "a move draws one link between two of your dots that share a side. if it would cross the other color's link, you can't draw it.",
    "after the first link blue can swap seats (the link stays red). undo and resign are in the panel.",
  ],
  hex: [
    "red joins left to right, blue joins top to bottom. a corner counts for both edges it touches.",
    "take turns putting one stone on an empty hex. first to join their two edges wins. it can't end in a draw.",
    "after the opening stone blue can swap seats. drag to pan, scroll to zoom.",
  ],
  twixt: [
    "no corners. red owns the top and bottom rows, blue owns left and right, and you can't play in the other side's border.",
    "place one peg, then add or remove your own links. a link joins two of your pegs a knight's move apart, and links can't cross.",
    "pegs on your border count as that border. join your two borders with a chain of links, then press done. blue can swap after the first peg.",
  ],
  punct: [
    "each side gets 18 three-dot pieces: four straight ones with the punct at the end, two straight with it in the middle, two angles of each hand, two with the punct on the corner, and six triangles. red goes first.",
    "place a piece on three empty spaces, or move one you already played. its punct slides any distance in a straight line, over anything, and then the piece can spin around the punct. R rotates the ghost.",
    "to stack, land the punct on one of your own dots. straight and angle pieces can bridge: both ends sit on the same level and the middle dot hangs. a covered dot is blocked and drops out of the connection. triangles can't bridge.",
    "visible dots that share a side are connected, whatever level they're on. either player can join any opposite pair. the three pairs are marked gold, green and purple.",
    "standard: a new piece can't touch the center nineteen, even partly. only moving a piece gets you in there. if someone places their last piece and nobody has connected, whoever has more of the center wins. basic drops the center ban after the opening, and running out of pieces with no connection is a draw.",
  ],
  star: [
    "the sides alternate, so the border has an odd count and a full board can't tie.",
    "a connected group touching three or more border cells scores the number it touches minus two. groups touching fewer score nothing.",
    "pass, or press score, once the rest can't change anything. two passes in a row also ends it. higher score wins. blue can swap after the first stone.",
  ],
  sstar: [
    "a pentagon of hexes. the star in the middle stays empty and joins all five cells around it for both colors at once, so two of your stones on that ring are connected even with the other color between them.",
    "a star is one connected group with two or more edge cells. it owns those cells, plus the edge cells it surrounds that no other star owns. three or more corners are worth an extra point.",
    "count each player's stars. whoever has fewer adds twice the difference, the other subtracts it. higher score wins and a full board can't tie. pass, or press score, to count early. blue can swap after the first stone.",
  ],
  y: [
    "both players want to touch all three sides of the triangle. a corner belongs to both sides it sits on.",
    "one stone on an empty hex each turn. first to reach all three sides wins. there's no draw.",
    "after the opening stone blue can swap seats.",
  ],
};
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
  margin: 0 0 8px;
  color: #aaa;
  font-size: 13px;
  line-height: 1.45;
}
</style>
