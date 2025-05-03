// js/game.js
import { createGrid, gridWidth, gridHeight } from './grid.js';
import { player } from './player.js';
import { mineTile } from './mining.js';
import { getTile } from './grid.js';


let mineTimeout = null;

export function initGame() {
  const gameContainer = document.getElementById("game");
  const oreDisplay = document.getElementById("ore-count");




  // Reset state
  player.ore = 0;
  oreDisplay.textContent = "0";
  gameContainer.innerHTML = "";

  createGrid(gameContainer);
  updatePlayerPosition();
  centerCameraOnPlayer();

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

function updatePlayerPosition() {
  // Remove old player marker
  document.querySelectorAll(".player").forEach((el) => el.classList.remove("player"));

  // Add .player class to the tile the player is on
  const tile = document.querySelector(`.tile[data-x="${player.x}"][data-y="${player.y}"]`);
  if (tile) tile.classList.add("player");
}

/* CAMERA BEHAVIOUR */

function centerCameraOnPlayer() {
  const wrapper = document.getElementById("game-wrapper");
  const playerTile = document.querySelector(`.tile[data-x="${player.x}"][data-y="${player.y}"]`);

  if (wrapper && playerTile) {
    const wrapperRect = wrapper.getBoundingClientRect();
    const tileRect = playerTile.getBoundingClientRect();

    const currentScrollLeft = wrapper.scrollLeft;
    const currentScrollTop = wrapper.scrollTop;

    const targetScrollLeft =
      currentScrollLeft + tileRect.left - wrapperRect.left - wrapper.clientWidth / 2 + tileRect.width / 2;
    const targetScrollTop =
      currentScrollTop + tileRect.top - wrapperRect.top - wrapper.clientHeight / 2 + tileRect.height / 2;

    smoothScroll(wrapper, currentScrollLeft, targetScrollLeft, currentScrollTop, targetScrollTop);
  }
}

/* CAMERA SMOOTHING */

function smoothScroll(element, startX, endX, startY, endY, duration = 150) {
  const startTime = performance.now();

  function animate(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

    element.scrollLeft = startX + (endX - startX) * ease;
    element.scrollTop = startY + (endY - startY) * ease;

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}




/* PLAYER MOVEMENT CONTROLS */

let moveInterval = null;
let heldDirection = null;

function movePlayer(key) {
  let newX = player.x;
  let newY = player.y;

  switch (key) {
    case "arrowup":
    case "w":
      newY--;
      break;
    case "arrowdown":
    case "s":
      newY++;
      break;
    case "arrowleft":
    case "a":
      newX--;
      break;
    case "arrowright":
    case "d":
      newX++;
      break;
  }

  const nextTile = getTile(newX, newY);
  if (!nextTile || nextTile.dataset.type === "rock") return; // ⛔️ Block movement

  player.x = newX;
  player.y = newY;
  updatePlayerPosition();
  centerCameraOnPlayer();
}


/* PLAYER HOLD BUTTON MOVEMENT CONTROLS */

function handleKeyDown(e) {
  const key = e.key.toLowerCase();

  // Prevent stacking intervals or repeats
  if (e.repeat || moveInterval) return;

  // Only react to movement keys
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    heldDirection = key;
    movePlayer(heldDirection); // 👈 move once immediately
    moveInterval = setInterval(() => {
      movePlayer(heldDirection);
    }, 250); // then continue stepping
  }

  // Mining still works
  if (key === " ") {
    if (!mineTimeout) {
      mineTimeout = setTimeout(() => {
        mineTile(player.x, player.y);
        mineTimeout = null;
      }, 1000);
    }
  }
}

function handleKeyUp(e) {
  if (e.key.toLowerCase() === heldDirection) {
    clearInterval(moveInterval);
    moveInterval = null;
    heldDirection = null;
  }

  if (e.key === " " && mineTimeout) {
    clearTimeout(mineTimeout);
    mineTimeout = null;
  }

}

