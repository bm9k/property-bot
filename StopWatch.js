export class StopWatch {
    constructor() {
      this.start = Date.now();
    }
  
    getElapsed() {
      const elapsed = Date.now() - this.start;
  
      return elapsed / 1000;
    }
  }
  