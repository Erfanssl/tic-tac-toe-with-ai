const squares = document.querySelectorAll('.square');
const container = document.querySelector('.container');
const boardEnd = document.querySelector('.board--end');

const winningConditions = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9],
    [1, 5, 9],
    [3, 5, 7]
];
const players = ['one', 'two'];
let playerTurn = players[0];
const playersChoices = {
    [players[0]]: [],
    [players[1]]: []
};

// squares click handler
squares.forEach(square => {
    square.onclick = () => {
        // check to see if it's not selected
        if (square.classList.contains('selected')) return;
        const choice = square.dataset.id;
        playersChoices[playerTurn].push(parseInt(choice));

        square.classList.add('selected');
        square.classList.add(playerTurn === players[0] ? "blue" : "yellow");

        if (square.classList.contains('blue')) container.style.boxShadow = 'inset 0 3px 10px 1px yellow';
        else container.style.boxShadow = 'inset 0 3px 10px 1px aqua';

        const pInSquare = document.querySelector(`.square[data-id="${ choice }"] p`);
        pInSquare.innerText = playerTurn === players[0] ? "X" : "O";

        // check to see if the player won
        const stop = showResult(playersChoices[playerTurn], playerTurn);

        if (stop) return;

        // toggle the player's turn
        playerTurn = players.filter(p => p !== playerTurn)[0];

        if (playerTurn === 'two') {
            setTimeout(() => {
                document.querySelector(`.square[data-id="${ aiMove() }"]`).click();
            }, 0);
        }
    };
});


function checkResult(choices, playersChoices) {
    let found = 0;
    let over = false;

    winningConditions.forEach(winningCond => {
        found = 0;

        winningCond.forEach(winNum => {
            if (choices.includes(winNum)) found++;
        });

        if (found >= 3) {
            return over = true;
        }
    });

    if (over) return 1;

    if (Object.values(playersChoices).reduce((acc, arr) => acc + arr.length, 0) >= 9) {
        // game was draw
        return 0;
    }

    return null;
}

function showResult(choices, playerTurn) {
    const res = checkResult(choices, playersChoices);

    if (res === 1) {
        boardEnd.classList.remove('hide');
        boardEnd.classList.add(playerTurn === players[0] ? "blue" : "yellow");
        boardEnd.innerText = `Player ${ playerTurn } won`;
        const winnerBorder = `inset 0 3px 10px 1px ${ playerTurn === players[0] ? "aqua" : "yellow" }`;
        container.style.boxShadow = winnerBorder;
        boardEnd.style.boxShadow = winnerBorder;
        return true;
    }

    if (res === 0) {
        // game was draw
        boardEnd.classList.remove('hide');
        boardEnd.innerText = `Draw!`;
        const drawBorder = `inset 0 3px 10px 1px #ffffff`;
        container.style.boxShadow = drawBorder;
        boardEnd.style.boxShadow = drawBorder;
        return true;
    }
}

function aiMove() {
    // first check to see what moves are available
    const movesDoneSoFar = Object.values(playersChoices).flat();
    const allPossibleMoves = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const availableMoves = allPossibleMoves.filter(p => !movesDoneSoFar.includes(p));
    const aiMoves = playersChoices[playerTurn];
    const movesWithScore = {};
    availableMoves.forEach(move => {
        movesWithScore[move] = 0;
    });
    const playerMoves = {
        ai: playersChoices[playerTurn],
        opponent: playersChoices[players.filter(p => p !== playerTurn)[0]]
    };

    function predict(root, playerMoves, currentMove, turn) {
        // evaluate the current move for whose turn it is
        const newPlayerMoves = JSON.parse(JSON.stringify(playerMoves));
        newPlayerMoves[turn].push(currentMove);
        const eval = checkResult(newPlayerMoves[turn], newPlayerMoves);

        if (eval === 1) {
            if (turn === 'ai') return 1;
            else return -1;
        }

        else if (eval === 0) return 0;

        // Now we check what available moves are now for the other player
        const movesDoneSoFar = Object.values(newPlayerMoves).flat();
        const currentAvailableMoves = allPossibleMoves.filter(p => !movesDoneSoFar.includes(p));

        const results = [];
        turn = turn === 'ai' ? 'opponent' : 'ai';
        for (let i = 0; i < currentAvailableMoves.length; i++) {
            const res = predict(root, newPlayerMoves, currentAvailableMoves[i], turn);
            results.push(res);
        }

        if (turn === 'ai') return Math.max(...results);
        else return Math.min(...results);
    }

    // check to see if there is any direct win for these available moves
    for (let i = 0; i < availableMoves.length; i++) {
        const res = checkResult([ ...aiMoves, availableMoves[i] ], playersChoices);
        if (res === 1) return availableMoves[i];
    }

    // check to see if there is any direct win for the opponent to stop that move
    for (let i = 0; i < availableMoves.length; i++) {
        const opponentRes = checkResult([ ...playerMoves.opponent, availableMoves[i] ], playersChoices);
        if (opponentRes === 1) return availableMoves[i];
    }

    // now we start the prediction
    const choices = {};
    for (let i = 0; i < availableMoves.length; i++) {
        const res = predict(availableMoves[i], playerMoves, availableMoves[i], 'ai');
        choices[availableMoves[i]] = res;
    }

    const bestResult = Math.max(...Object.values(choices));
    for (const choice in choices) {
        if (choices[choice] !== bestResult) delete choices[choice];
    }

    // now we can return the best choice (if it's only one and if multiple we can return randomly)
    const choicesArr = Object.keys(choices);
    return choicesArr[Math.floor(Math.random() * choicesArr.length)];
}