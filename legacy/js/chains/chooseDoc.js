  // [chain:chooseDoc] 1 layer; the original in [13] and older layers were dead code and are removed.
  //   Call order, outermost first: chooseDoc
  //   Each layer runs its own code and calls the one below it. Edit the layer that owns the behaviour.
  // chooseDoc: from [v128], does NOT call the layer below
  function chooseDoc(id) { const tm = currentTurn; if (doctrine[tm]) return; toast(`공병으로 ${DOC[id].n[tm]} 지원소(💰150 ⛽40)를 건설하세요.`); }


