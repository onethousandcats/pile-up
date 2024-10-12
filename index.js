const fs = require('fs');

console.log('PILE-UP POKER CALCULATOR');

const args = process.argv.slice(2);

const scoring = [450, 325, 180, 125, 80, 60, 5, 0];
const multiplier = [1, 2, 3];

const corners = 1;
const discard = 2;

const cardValue = (card) => parseInt(card.match(/\d+/));

const getCards = () => {
    const data = fs.readFileSync(`./data/${args}.txt`)
        .toString()
        .replace(/\r/g, '')
        .split('\n')
        .map((hand) => hand.split(/\s+/));

    data.forEach((hand, i) => {
        hand.forEach((card, j) => {
            if (cardValue(card) === 1) {
                data[i][j] = `${card.charAt(0)}14`;
            }
        });
    });

    return data;
}

const representation = (card) => {
    const suit = card.charAt(0);
    const face = card.slice(1);

    const suits = {
        H: "♥", // Heart
        S: "♠", // Spade
        C: "♣", // Club
        D: "♦"  // Diamond
      };

    const faces = {
        11: "J",
        12: "Q",
        13: "K",
        14: "A"
    };

    return `[${suits[suit]}${faces[face] || face}]`;
}

const mostOccurences = (cards) => {
    const countMap = {};

    cards.forEach(card => {
        countMap[cardValue(card)] = (countMap[cardValue(card)] || 0) + 1;
    });

    const countArray = Object.entries(countMap);

    countArray.sort((a, b) => b[1] - a[1]);

    return countArray.slice(0, 2).map(entry => entry[1]);
}

const checkHand = (cards) => {
    let val = 0;

    const ordered = cards.sort((a, b) => cardValue(a) - cardValue(b));
    const suited = ordered.every((card, _, arr) => card[0] === arr[0][0]);
    const straight = ordered.every((card, i, array) => i === 0 || cardValue(card) === cardValue(array[i - 1]) + 1);
    const most = mostOccurences(cards);

    if (straight && suited)
        val = scoring[0];
    else if (most[0] === 4)
        val = scoring[1];
    else if (straight) {
        val = scoring[2];
    }
    else if (most[0] === 3)
        val = scoring[3];
    else if (suited)
        val = scoring[4];
    else if (most[0] === 2 && most[1] === 2)
        val = scoring[5];
    else if (most[0] === 2)
        val = scoring[6];

    val *= multiplier[discard];
    
    return { hand: ordered, val };
}

const discardHands = (cards) => {
    const getCombos = (cards, prefix = []) => {
        if (cards.length === 0)
            return [prefix];
        
        let result = [];

        for (let card of cards[0]) {
            result = result.concat(getCombos(cards.slice(1), prefix.concat(card)));
        }

        return result;
    }

    const discards = getCombos(cards);
    const result = discards.map((hand) => checkHand(hand));

    return result
        .filter((hand) => hand.val > 15)
        .sort((a, b) => b.val - a.val);
};

const splitGaps = (arr) => {
    if (arr.length === 0) return [];

    const result = [];
    let currentSubarray = [arr[0]]; // Start with the first element in a new subarray

    for (let i = 1; i < arr.length; i++) {
        if (cardValue(arr[i]) - cardValue(arr[i - 1]) > 1) {
            result.push(currentSubarray);
            currentSubarray = [];
        }
        currentSubarray.push(arr[i]); 
    }

    result.push(currentSubarray);

    return result;
}

const splitOverlap = (arr, n) => {
    const result = [];

    for (let i = 0; i <= arr.length - n; i++) {
        result.push(arr.slice(i, i + n));
    }

    return result;
}

const royalFlushes = (cards) => {
    const c = Object.values(cards.flat()
        .sort((a, b) => cardValue(a) - cardValue(b))
        .reduce((acc, c) => {
            const key = c.charAt(0);
            (acc[key] ||= []).push(c);

            return acc;
        }, {}))
        .map((suit) => splitGaps(suit))
        .flat()
        .filter((run) => run.length >= 4);

    
    return c.map((suit) => splitOverlap(suit, 4)).flat();
}


/////////////////////////////////////////////////////

const cards = getCards();

const rep = cards.map(hand => {
    return hand.map((card) => representation(card));
});

const discards = discardHands(cards);
const royalFs = royalFlushes(cards);

console.log('Cards');
console.log(rep);

console.log('Royal Flushes');
console.log(royalFs.map(hands => hands.map(card => representation(card))));

console.log('Discards');
console.log(discards.map(({hand, val}) => ({ hand: hand.map(c => representation(c)), val })));