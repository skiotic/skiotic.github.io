class Queue {
  /**
   * Linked list queue data structure.
   */
  constructor() {
    this.head = null;
  }

  get isEmpty() {
    return this.head === null;
  }

  pushBack = value => {
    const node = {value, next: null, prev: null};
    if (this.isEmpty) {
      return (this.head = node).value;
    }
    let curNode = this.head;
    while (curNode.next !== null) {
      curNode = curNode.next;
    }
    node.prev = curNode;
    return (curNode.next = node).value;
  }

  pushFront = value => {
    const node = {value, next: null, prev: null};
    if (this.isEmpty) {
      return (this.head = node).value;
    }
    const oldHead = this.head;
    oldHead.prev = node;
    node.next = oldHead;
    return (this.head = node).value;
  }

  popBack = () => {
    if (this.isEmpty) {
      return;
    }
    let curNode = this.head;
    while (curNode.next !== null) {
      curNode = curNode.next;
    }
    const popped = curNode.value;
    if (this.curNode.prev === null) {
      this.head = null;
      return popped;
    }
    curNode = curNode.prev;
    curNode.next = null;
    return popped;
  }

  popFront = () => {
    if (this.isEmpty) {
      return;
    }
    const popped = this.head.value;
    if (this.head.next === null) {
      this.head = null;
      return popped;
    }
    this.head = this.head.next;
    this.head.prev = null;
    return popped;
  }

  clear = () => {
    this.head = null;
  }

  get [Symbol.toStringTag]() {
    return 'Queue';
  }

  *[Symbol.iterator]() {
    if (this.isEmpty) {
      return;
    } else {
      let curNode = this.head;
      yield curNode.value;
      while (curNode.next !== null) {
        curNode = curNode.next;
        yield curNode.value;
      }
    }
  }
}
