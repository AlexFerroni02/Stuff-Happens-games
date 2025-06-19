import dayjs from 'dayjs';

function Round(id, gameID, cardId, roundNumber, status) {
  this.id = id;
  this.gameID = gameID;
  this.cardId = cardId;
  this.roundNumber = roundNumber;
  this.status = status;


  this.serialize = () => {
    const serialized = {
      id: this.id,
      gameID: this.gameID,
      cardId: this.cardId,
      roundNumber: this.roundNumber,
      status: this.status,
    };
    if (this.cardName !== undefined) serialized.cardName = this.cardName;
    if (this.cardImage !== undefined) serialized.cardImage = this.cardImage;
    if (this.cardSfortunaIndex !== undefined) serialized.cardSfortunaIndex = this.cardSfortunaIndex;
    return serialized;
  };
}


function Game(id, userId, status, date, totalCards, totalMistakes) {
  this.id = id;
  this.userId = userId;
  this.status = status;
  this.date = dayjs(date); 
  this.totalCards = totalCards ;
  this.totalMistakes = totalMistakes ;
 

}

export { Game, Round };