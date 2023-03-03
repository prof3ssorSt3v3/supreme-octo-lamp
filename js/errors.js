class NetworkError extends Error {
  //fetch request got an undesirable response
  constructor(msg, response) {
    super(msg);
    this.name = 'NetworkError';
    this.type = 'NetworkError';
    this.status = response.status;
    this.response = response;
  }
}

class EmptyInputError extends Error {
  //an input field is left empty
  constructor(msg, input) {
    super(msg);
    this.name = 'EmptyInputError';
    this.type = 'EmptyInputError';
    this.input = input; //reference to the input element
  }
}

class CacheError extends Error {
  //failure of some cache operation
  constructor(msg, cacheName) {
    super(msg);
    this.name = 'CacheError';
    this.type = 'CacheError';
    this.cacheName = cacheName;
  }
}

export { NetworkError, CacheError, EmptyInputError };
