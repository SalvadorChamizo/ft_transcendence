export function matchOnePlayerOne() {

}

        <span id="middle-line" class="tournament-line-middle"></span>
        <span id="middle-line-left" class="tournament-line-middle-left"></span>
        <span id="middle-line-right" class="tournament-line-middle-right"></span>
          <span id="down-line-left" class="tournament-line-down-left"></span>
          <span id="up-line" class="tournament-line-up"></span>
          <span id="down-line-right" class="tournament-line-down-right"></span>

export function semifinalPlayerOneLoses() {
    const middleLineLeft = document.getElementById("middle-line");
    const downLineLeft = document.getElementById("down-line-left");

    if (middleLineLeft) {
        middleLineLeft.style.backgroundColor = "#fa4242";
    }

    if (downLineLeft) {
        downLineLeft.style.backgroundColor = "#fa4242";
    }
}