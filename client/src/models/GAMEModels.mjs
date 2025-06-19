import dayjs from 'dayjs';




function Game(id, userId, status, date, totalCards, totalMistakes) {
  this.id = id;
  this.userId = userId;
  this.status = status;
  this.date = dayjs(date); 
  this.totalCards = totalCards ;
  this.totalMistakes = totalMistakes ;
  this.rounds_details = []; 

  

}

export { Game };